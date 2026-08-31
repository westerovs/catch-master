import {gsap} from 'gsap'
import {GAME_STATES} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import type Game from '@/game/Game.ts'
import BaseState from '@/game/states/BaseState.ts'
import Level from '@/game/states/stateLevel/Level.ts'
import LevelView from '@/game/states/stateLevel/LevelView.ts'

// Состояние создаёт, завершает и перезапускает игровой уровень.

export default class StateLevel extends BaseState {
  declare level: Level | null

  #game: Game
  #view: LevelView | null = null
  #replayLevelIndex: number | null = null
  #replayLevelNumber: number | null = null

  constructor(game: Game) {
    super(game)
    this.#game = game
  }

  get initEventName() {
    return GAME_STATES.levelState
  }

  get levelView(): LevelView {
    return this.#view!
  }

  initialize() {
    super.initialize()

    this.#view = new LevelView()
    this.#game.gameContainer.addChild(this.#view)

    this.#game.view = this.#view
    this.#game.refs = this.#view.refs
    this.isInitialized = true
    this.start()
  }

  async start() {
    const levelIndex = this.#replayLevelIndex ?? Locator.storage.levelIndex
    const levelNumber = this.#replayLevelNumber ?? Locator.storage.userLevel
    const shouldAdvanceProgress = this.#replayLevelIndex === null

    this.level = new Level(this, {levelIndex, levelNumber, shouldAdvanceProgress})
    this.level.init()
    await Locator.gameResize.resize()
    Locator.soundManager.startLevelMusic()
  }

  runNextLevel = async () => {
    await this.level?.exit()

    this.#replayLevelIndex = null
    this.#replayLevelNumber = null
    this.terminate()
    this.#game.emit(GAME_STATES.levelPreload)
  }

  restart = async () => {
    const level = this.level
    if (!level) {
      console.error('[StateLevel]: active level is missing, restart skipped')
      return
    }

    this.#replayLevelIndex = level.levelIndex
    this.#replayLevelNumber = level.levelNumber
    await level.exit({unloadBundle: false})

    this.terminate()
    this.initialize()
  }

  checkoutState = async (stateName: string) => {
    super.checkoutState(stateName)
    await this.level?.exit()

    this.#replayLevelIndex = null
    this.#replayLevelNumber = null
    this.terminate()
    this.#game.emit(stateName)
  }

  terminate() {
    Locator.soundManager.stopLevelMusic()

    // Общая очистка
    gsap.killTweensOf('*')
    gsap.globalTimeline.clear()
    Locator.uiLayer.destroyStateUiLayerChildren()
    // view destroy
    this.#view?.destroy({children: true})
    this.#view = null
    this.level = null
    this.#game.view = null

    this.isInitialized = false
  }
}
