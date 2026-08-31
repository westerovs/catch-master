import Locator from '../engine/Locator.ts'
import ABTest from '../modules/ABTest.ts'
import YaMetrika from '../modules/metrika/YaMetrika.ts'
import GameUtils from '../utils/gameUtils/GameUtils.ts'
import LoadUtils from '../utils/gameUtils/LoadUtils.ts'
import {ASSETS_URL} from './constants.ts'

type LevelData = {
  levelName: string
  amb?: string
  music?: string
  back?: string
  isRemote?: boolean
}

type CurrentLevelConfig = {
  levelName: string
  bgTexture: string
  amb?: string
  levelType: string | null | undefined
}

/*
 * hybridPath - задаётся при сборке. Нужен для разделения путей динамической загрузки.
 * Загрузка может быть как из папки архива, так и по ссылке с облака
 *
 * folderPath - используется как относительная ссылка внутри папки assets.
 * Необходима для точечной загрузки ассетов, которые могут лежать отдельно
 * */

// todo переименовать - класс уже не отвечает своему имени и назначению, это уже скорее preloadConfig
// todo рефакторить. Пересмотреть вызовы и доступность извне. Возможно сделать как Locator.levelConfig

export default class LevelConfig {
  #storage = Locator.storage
  #config: CurrentLevelConfig | null = null

  static maxLevels = 0
  static levelJsonNumber: number | null = null
  static levelName: string | null = null

  static getMaxLevels() {
    const levels = ABTest.getFilteredLevels() as Record<string, LevelData>
    return Object.keys(levels).length - 1
  }

  // извлекает номер уровня из строки, если она содержит шаблон level10 -> 10
  static getLevelNumber = (text: string) => {
    const match = text.match(/level(\d+)/)
    return match ? Number(match[1]) : null
  }

  // todo в этом месте стоит хранить вообще всё что нужно для уровня.
  static getGameLevelData = (levelIndex: number) => {
    const levels = ABTest.getFilteredLevels() as Record<string, LevelData>
    const maxLevels = Object.keys(levels).length - 1
    LevelConfig.maxLevels = maxLevels

    // Если уровень игрока выше чем число доступных уровней, ставим игроку последний уровень из возможных
    if (levelIndex > maxLevels) {
      Locator.storage.playerData.levelIndex = maxLevels
      levelIndex = maxLevels
    }

    const levelData = Object.values(levels)[levelIndex]
    const {levelName, amb, music} = levelData

    const levelJsonNumber = LevelConfig.getLevelNumber(levelName)
    LevelConfig.levelJsonNumber = levelJsonNumber
    LevelConfig.levelName = levelName

    const backgroundName = levelData?.back ? levelData.back : `back_lv${levelJsonNumber}`

    let hybridPath = ASSETS_URL.local
    if (levelData.isRemote) hybridPath = ASSETS_URL.remote

    return {
      hybridPath,
      amb,
      music,
      levelData,
      levelJsonNumber,

      // background
      backgroundName,
      background: {alias: backgroundName, src: LoadUtils.forceFreshCache(`${hybridPath}assets/levels/backgrounds/${backgroundName}.webp`)},
      levelName,
      levelType: GameUtils.extractSuffix(levelName),
    }
  }

  static get levelType() {
    return GameUtils.extractSuffix(LevelConfig.levelName)
  }

  public getConfig = (levelIndex = this.#storage.playerData.levelIndex): CurrentLevelConfig => {
    const {levelName, amb, backgroundName} = LevelConfig.getGameLevelData(levelIndex)

    this.#config = {
      levelName,
      bgTexture: backgroundName,
      amb,
      levelType: GameUtils.extractSuffix(levelName),
    }

    YaMetrika.startLevel(this.#config, this.#storage)
    return this.#config
  }

  public updateSavedLevel = () => {
    const currentLevel = this.#storage.playerData.levelIndex
    this.#storage.playerData.levelIndex = currentLevel + 1

    this.#checkAllLevelsComplete()
    this.#storage.save()
  }

  #checkAllLevelsComplete = () => {
    const {levelIndex} = this.#storage.playerData

    if (levelIndex <= LevelConfig.maxLevels) return

    this.#storage.playerData.levelIndex = 0
    YaMetrika.completeGame()
  }
}
