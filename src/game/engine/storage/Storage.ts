import {PLATFORM_ID} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import {
  DEFAULT_DATA_VALUES,
  type PlayerProfile,
  SERIALIZED_ARRAY_KEYS,
  STORAGE_KEYS,
  type StorageKey,
} from '@/game/engine/storage/defaultData.ts'
import GameSettings from '@/game/engine/storage/GameSettings.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.ts'
import {
  createProfileProxy,
  getMaxFreshData,
  getMaxUserLevelData,
  parseJsonKey,
  stringifyJsonKey,
} from '@/game/engine/storage/utils/utils.ts'
import Validation from '@/game/engine/storage/utils/Validation.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import {PACKAGE_VERSION} from '@/game/generatedAssets/buildMeta.ts'
import OfflineBadge from '@/game/utils/gameUtils/OfflineBadge.ts'
import MathTools from '@/game/utils/MathTools.ts'

// todo рефактор ответственности
export default class Storage {
  static instance: Storage | undefined

  #game: Game
  #gameSettings = new GameSettings(this)
  #localStorage = new LocalStorage()
  #rawData: Record<string, any> = {}
  #playerData!: PlayerProfile
  #isDebug = false

  constructor(game: Game) {
    this.#game = game
  }

  get gameSettings() {
    return this.#gameSettings
  }

  get playerData() {
    return this.#playerData
  }

  get userLevel() {
    return this.#playerData.userLevel
  }

  get levelIndex() {
    return this.#playerData.levelIndex
  }

  get maxScore() {
    return this.#playerData.maxScore
  }

  load = async () => {
    try {
      this.#localStorage.init()

      const saves = await this.#loadSaves()
      const freshestData = this.#selectFreshestData(saves)
      const playerData = this.#preparePlayerData(freshestData)

      this.#setProxyData(playerData)
    } catch (err) {
      console.error('[load]', err)
    }
  }

  save = (force = false) => {
    if (this.#isDebug) {
      console.error('[Storage] save off!')
      return
    }

    OfflineBadge.checkAndShow()

    this.#rawData = {...this.#playerData}
    this.#rawData.playerId = SdkManager.getPlayerId()
    this.#rawData.savedAt = new Date().toISOString()

    SERIALIZED_ARRAY_KEYS.forEach((key) => {
      this.#rawData[key] = stringifyJsonKey(this.#rawData[key])
    })

    this.#localStorage.save(this.#rawData)

    if (!SdkManager.isPlatform(PLATFORM_ID.base)) {
      SdkManager.adapter.storage.set(this.#rawData, force).catch((err: unknown) => console.error('[save]', err))
    }
  }

  get hints() {
    return this.#playerData.hints
  }
  // todo добавляет не только хинты, а все товары из магазина и монетки
  addHints = (id: string, amount: number, save = true) => {
    if (!id) return
    if (!MathTools.isNumber(amount)) {
      console.error(`[addHints] id ${id} not a number: ${amount}`)
      return
    }

    if (id === STORAGE_KEYS.hints) {
      this.#playerData.hints += amount
      this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.hints, type: 'added'})
    }
    if (id === STORAGE_KEYS.hintDarts) {
      this.#playerData.hintDarts += amount
      this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.hintDarts, type: 'added'})
    }
    if (id === STORAGE_KEYS.hintCompass) {
      this.#playerData.hintCompass += amount
      this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.hintCompass, type: 'added'})
    }
    if (id === STORAGE_KEYS.coins) {
      this.#playerData.coins += amount
      this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.coins, type: 'added'})
    }

    if (save) this.save(true)
  }

  addCoins = (amount: number) => {
    if (!MathTools.isNumber(amount)) {
      console.error(`[addCoins] id not a number: ${amount}`)
      return
    }

    this.#playerData.coins += amount
    this.save(true)
  }

  // todo проверка на меньше 0, т.к текущая не гарантирует уход в минус, если списание большое
  spendCoins = (amount: number, save = true) => {
    if (!MathTools.isNumber(amount)) {
      console.error(`[spendCoins] id not a number: ${amount}`)
      return
    }

    if (this.#playerData.coins <= 0) return

    this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.coins, type: 'spend'})
    this.#playerData.coins -= amount

    if (save) this.save(true)
  }

  spendHints = (hintName: typeof STORAGE_KEYS.hints | typeof STORAGE_KEYS.hintDarts | typeof STORAGE_KEYS.hintCompass) => {
    if (this.#playerData[hintName] <= 0) return

    this.#playerData[hintName] -= 1
    this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: hintName, type: 'spend'})
    this.save()
  }

  resetAllData = () => {
    if (LocalStorage._storage) {
      localStorage.clear()
      LocalStorage.clear()
    }

    this.#playerData = {...DEFAULT_DATA_VALUES}
    this.#syncLeaderboardScore()

    this.save(true)
    Locator.game.app.stage.visible = false
    setTimeout(() => location.reload(), 2500)
  }

  updateUserRecord = () => {
    this.#playerData.userLevel += 1
    this.#syncLeaderboardScore()
  }

  updateMaxScore = (score: number) => {
    if (!MathTools.isNumber(score)) {
      console.error(`[Storage]: score is not a number: ${score}`)
      return false
    }
    if (score <= this.#playerData.maxScore) return false

    this.#playerData.maxScore = score
    return true
  }

  #syncLeaderboardScore = () => {
    if (!SdkManager.leaderboard?.isAvailable()) return

    SdkManager.leaderboard.setScore(this.#playerData.userLevel).catch((e: unknown) => {
      console.error('[leaderboard.setScore]', e)
    })
  }

  // ------------- save / load
  #loadSaves = async () => {
    const [serverData, localData] = await Promise.all([SdkManager.getData(), this.#localStorage.getData()])

    const saves: Record<string, unknown>[] = []
    if (Array.isArray(serverData)) saves.push(...serverData.flat(1))
    if (Array.isArray(localData)) saves.push(...localData.flat(1))

    return saves
  }

  #selectFreshestData = (saves: Record<string, unknown>[]) => {
    const freshestData = getMaxFreshData(saves)

    if (freshestData === null) return getMaxUserLevelData(saves)

    return freshestData
  }

  #preparePlayerData = (data: Record<string, unknown> | null) => {
    const validatedData = Validation.validate(data)
    const serializedData = validatedData as unknown as Record<string, unknown>

    SERIALIZED_ARRAY_KEYS.forEach((key) => {
      serializedData[key] = parseJsonKey(serializedData, key as StorageKey)
    })

    return validatedData
  }

  #setProxyData = (freshestData: PlayerProfile) => {
    freshestData.version = PACKAGE_VERSION
    freshestData.playerId = SdkManager.getPlayerId()
    this.#rawData = freshestData

    this.#playerData = createProfileProxy(freshestData, 'PlayerProfile')
  }
}
