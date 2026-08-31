import {GAME_STATES, PLATFORM_ID} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import type {PlayerProfile} from '@/game/engine/storage/defaultData.ts'
import type Storage from '@/game/engine/storage/Storage.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import BaseState from '@/game/states/BaseState.ts'
import Finalize from '@/game/states/preload/levelPreload/states/Finalize.ts'
import InitialLoad from '@/game/states/preload/levelPreload/states/InitialLoad.ts'
import LoadLevelResources from '@/game/states/preload/levelPreload/states/LoadLevelResources.ts'
import PreparePreloadText, {type PreloadTextData} from '@/game/states/preload/levelPreload/states/PreparePreloadText.ts'
import type PreloadView from '@/game/states/preload/PreloadView.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

let isFirstInit = false

export default class LevelPreload extends BaseState {
  declare view: PreloadView | null
  storage: Storage | null = null
  playerData: PlayerProfile | null = null
  levelIndex: number | null = null
  textPreloadData: PreloadTextData | null = null
  #sfxIsLoaded = false
  #loadResourcesState: LoadLevelResources | null = null

  get initEventName() {
    return GAME_STATES.levelPreload
  }

  async initialize() {
    super.initialize()

    SdkManager.gameplayStop()

    const storage = Locator.storage
    if (!storage) {
      console.error('[LevelPreload]: storage is unavailable, level loading aborted')
      return
    }

    this.storage = storage
    this.levelIndex = storage.playerData.levelIndex
    this.playerData = storage.playerData
    const adPromise = this.#maybeShowAd()

    // prepare
    await this.#runInitializeState()
    await this.#runPreparePreloadText()
    // level load
    await this.#runLoadLevelResources(this.levelIndex)
    this.#postLoadLazySFX()

    // ждём окончания рекламы
    await adPromise

    await this.#checkoutState()
  }

  terminate() {
    this.game.emit(GAME_EVENTS.clearLevel)
    this.isInitialized = false

    this.view?.destroy({children: true})
    this.view = null
    this.storage = null
    this.playerData = null
    this.levelIndex = null
    this.textPreloadData = null
  }

  #maybeShowAd = () => {
    const levelIndex = this.levelIndex
    const storage = this.storage
    if (levelIndex === null || !storage) {
      console.error('[LevelPreload]: ad display data is not ready, ad skipped')
      return Promise.resolve()
    }

    if (!isFirstInit) {
      isFirstInit = true
      return Promise.resolve()
    }

    let resolveAD!: () => void

    const adPromise = new Promise<void>((resolve) => {
      resolveAD = resolve
    })

    // Платформа VK — пропуск рекламы
    if (SdkManager.isPlatform(PLATFORM_ID.vk)) {
      resolveAD()
      return adPromise
    }

    if (GameUtils.skipAdInFirstLevel(levelIndex)) {
      resolveAD()
      return adPromise
    }

    // Нет AdPass — показываем рекламу
    const hasAdPass = storage.playerData.hasAdPass
    if (!hasAdPass) {
      SdkManager.showInterstitial({
        onFinally: resolveAD,
      })
      return adPromise
    }

    // По умолчанию пропускаем
    resolveAD()
    return adPromise
  }

  #runInitializeState = async () => {
    const initialState = new InitialLoad(this)
    initialState.initView()
    this.view = initialState.view
    await initialState.execute()

    this.isInitialized = true
  }

  #runPreparePreloadText = async () => {
    const prepareState = new PreparePreloadText(this)
    await prepareState.execute()
    this.textPreloadData = prepareState.textPreloadData
    await Locator.gameResize.resize()
  }

  #runLoadLevelResources = async (levelIndex: number) => {
    this.#loadResourcesState = new LoadLevelResources(this, true)
    await this.#loadResourcesState.execute(levelIndex)
  }

  #checkoutState = async () => {
    super.checkoutState(GAME_STATES.levelState)

    const finalizeState = new Finalize(this)
    await finalizeState.startGame()
  }

  #postLoadLazySFX = async () => {
    if (this.#sfxIsLoaded) return
    await Locator.soundManager.preloadSFXFLevel() // фоновая загрузка SFX
    this.#sfxIsLoaded = true
  }
}
