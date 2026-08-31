import {Container} from 'pixi.js'
import LevelCounter from '@/game/components/levelComponents/LevelCounter.ts'
import LevelScore from '@/game/components/levelComponents/LevelScore.ts'
import LevelTimer from '@/game/components/levelComponents/LevelTimer.ts'
import LevelTimerView from '@/game/components/levelComponents/LevelTimerView.ts'
import LevelConfig from '@/game/config/LevelConfig.ts'
import {getLevelDifficultyConfig} from '@/game/config/levelDifficulty.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import CrazyGames from '@/game/engine/special/CrazyGames.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import LevelResultsReward from '@/game/features/levelResultsReward/LevelResultsReward.ts'
import {ROUND_DURATION_SECONDS} from '@/game/levelRuntime/gameplayConfig.ts'
import LevelRuntime from '@/game/levelRuntime/LevelRuntime.ts'
import type StateLevel from '@/game/states/stateLevel/StateLevel.ts'
import StateIntro from '@/game/states/stateLevel/states/intro/StateIntro.ts'
import CompleteLevel from '@/game/ui/level/completeLevelScreen/CompleteLevel.ts'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.ts'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.ts'

// Класс управляет игровым уровнем и его основными компонентами.

type LevelExitOptions = {
  unloadBundle?: boolean
}

type LevelOptions = {
  levelIndex: number
  levelNumber: number
  shouldAdvanceProgress: boolean
}

export default class Level {
  declare state: StateLevel

  #game = Locator.game
  #stage = this.#game.app.stage
  #stateIntro!: StateIntro
  #completeLevel!: CompleteLevel
  #levelCounter!: LevelCounter
  #levelScore!: LevelScore
  #levelTimer!: LevelTimer
  #levelTimerView!: LevelTimerView
  #levelRuntime!: LevelRuntime
  #levelConfigService!: LevelConfig
  #levelConfig!: ReturnType<LevelConfig['getConfig']>
  readonly #levelIndex: number
  readonly #levelNumber: number
  readonly #shouldAdvanceProgress: boolean
  #isLevelCompleted = false

  constructor(state: StateLevel, {levelIndex, levelNumber, shouldAdvanceProgress}: LevelOptions) {
    this.state = state
    this.#levelIndex = levelIndex
    this.#levelNumber = levelNumber
    this.#shouldAdvanceProgress = shouldAdvanceProgress

    this.#stage.interactiveChildren = false
    Locator.uiLayer.stateUiLayer.visible = false
  }

  get levelConfig() {
    return this.#levelConfig
  }

  get levelIndex() {
    return this.#levelIndex
  }

  get levelNumber() {
    return this.#levelNumber
  }

  public async init() {
    this.#setEvents(true)
    this.#initComponents()
    this.#initConfig()

    this.#createBackground()
    await this.#stateIntro.execute()
    this.#initLevelRuntime()
    this.#levelTimer.start()

    this.unlockScene()
    SdkManager.gameplayStart()
    SdkManager.gameReady()
  }

  // exit срабатывает при win и fail
  public exit = async ({unloadBundle = true}: LevelExitOptions = {}) => {
    CrazyGames.hideAllAdaptiveBanners()
    SdkManager.gameplayStop()
    if (unloadBundle) await LoadUtils.unloadLevelBundle(this.#levelConfig.levelName)

    this.#stage.interactiveChildren = false

    this.#game.emit(GAME_EVENTS.completeLevel)
    this.#setEvents(false)

    this.#levelTimer.destroy()
    this.#levelScore.destroy()
    this.#levelRuntime.destroy()
    this.#game.emit(GAME_EVENTS.clearLevel)
  }

  public unlockScene = () => {
    this.#stage.interactiveChildren = true
    this.#game.gameContainer.eventMode = 'static'
  }

  #createBackground = () => {
    const {bgTexture} = this.levelConfig
    this.state.levelView.createBackground(bgTexture)
  }

  #initComponents = () => {
    this.#stateIntro = new StateIntro(this)
    this.#completeLevel = new CompleteLevel(this)
    this.#levelConfigService = new LevelConfig()
    this.#createLevelCounter()
    this.#createLevelScore()
    this.#createLevelTimerView()
    this.#createLevelTimer()
  }

  #createLevelCounter = () => {
    this.#levelCounter = new LevelCounter()
    Locator.uiLayer.stateUiLayer.addChild(this.#levelCounter)
    Locator.uiLayer.resizeAdaptive(this.#levelCounter)
  }

  #createLevelScore = () => {
    this.#levelScore = new LevelScore(this.#levelCounter.setScore.bind(this.#levelCounter))
    this.#levelScore.init()
  }

  #createLevelTimerView = () => {
    this.#levelTimerView = new LevelTimerView(ROUND_DURATION_SECONDS)
    Locator.uiLayer.stateUiLayer.addChild(this.#levelTimerView)
    Locator.uiLayer.resizeAdaptive(this.#levelTimerView)
  }

  #createLevelTimer = () => {
    const updateTimerView = this.#levelTimerView.setTime.bind(this.#levelTimerView)
    this.#levelTimer = new LevelTimer(ROUND_DURATION_SECONDS, updateTimerView)
  }

  #initConfig = () => {
    this.#levelConfig = this.#levelConfigService.getConfig(this.#levelIndex)
  }

  #setEvents = (bool: boolean): void => {
    const toggle = eventToggle(bool)

    this.#game[toggle.gameOnOff](GAME_EVENTS.completeLevelWin, this.#winAction)
    this.#game[toggle.gameOnOff](GAME_EVENTS.LEVEL.forceNextLevel, this.#forceNextLevel)
    this.#game[toggle.gameOnOff](GAME_EVENTS.LEVEL.timeExpired, this.#winAction)
  }

  #initLevelRuntime = () => {
    let view = this.#game.view

    if (!view) {
      console.error('[Level: game.view]')
      view = new Container({label: 'levelFallbackView'})
      this.#game.gameContainer.addChild(view)
      this.#game.view = view
    }

    const difficultyConfig = getLevelDifficultyConfig(this.#levelNumber)
    this.#levelRuntime = new LevelRuntime({view, difficultyConfig})
    this.#levelRuntime.init()
  }

  #winAction = async () => {
    if (this.#isLevelCompleted) return
    this.#isLevelCompleted = true

    const score = this.#levelScore.score
    this.#levelTimer.destroy()
    this.#levelScore.destroy()
    this.#levelRuntime.destroy()
    Locator.uiLayer.stateUiLayer.visible = false

    SdkManager.gameplayStop()

    this.#game.emit(GAME_EVENTS.completeLevel)
    const isNewRecord = this.#updateLevelProgress(score)

    await this.#initSpecialPlatformActions()
    // await this.#initLevelResultsReward()

    await this.#completeLevel.init({
      score,
      maxScore: Locator.storage.maxScore,
      isNewRecord,
    })
  }

  #initSpecialPlatformActions = async () => {
    await GameUtils.showVkOkAdAfterLevelStart()
    CrazyGames.showCrazyGamesBanner()
  }

  #initLevelResultsReward = async () => {
    if (SdkManager.flags.noCoins) return
    await new LevelResultsReward().init()
  }

  // debug event
  #forceNextLevel = async () => {
    if (this.#isLevelCompleted) return
    this.#isLevelCompleted = true
    this.#game.emit(GAME_EVENTS.completeLevel)
    this.#updateLevelProgress(this.#levelScore.score)
  }

  #updateLevelProgress = (score: number) => {
    const isNewRecord = Locator.storage.updateMaxScore(score)

    if (!this.#shouldAdvanceProgress) {
      if (isNewRecord) Locator.storage.save()
      return isNewRecord
    }

    Locator.storage.updateUserRecord()
    this.#levelConfigService.updateSavedLevel()
    return isNewRecord
  }
}
