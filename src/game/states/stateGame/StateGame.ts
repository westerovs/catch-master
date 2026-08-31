import {gsap} from 'gsap'
import {GAME_STATES} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import BaseState from '@/game/states/BaseState.ts'
import GameView from '@/game/states/stateGame/GameView.ts'
import StartScreen from '@/game/states/stateGame/startScreen/StartScreen.ts'
import MagicDust from '@/game/ui/common/emitters/magicDust/MagicDust.ts'

export default class StateGame extends BaseState {
  declare stateStartScreen: StartScreen | null

  #game: Game
  #view: GameView | null = null

  constructor(game: Game) {
    super(game)
    this.#game = game
  }

  get initEventName() {
    return GAME_STATES.gameState
  }

  initialize() {
    super.initialize()
    this.#view = new GameView()
    this.#game.gameContainer.addChild(this.#view)

    this.#game.view = this.#view
    this.#game.refs = this.#view.refs
    this.isInitialized = true

    this.start()
  }

  async start() {
    this.stateStartScreen = new StartScreen(this)
    this.stateStartScreen.init()
    await Locator.gameResize.resize()
    this.stateStartScreen.setInteractive(true)
    SdkManager.gameReady()

    const view = this.#view
    if (!view) {
      console.error('[StateGame]: view was destroyed before MagicDust started')
      return
    }

    new MagicDust(this.#game, view).init()
  }

  checkoutState = async (stateName: string) => {
    super.checkoutState(stateName)
    this.terminate()
    this.#game.emit(stateName)
  }

  terminate() {
    // events
    this.#game.emit(GAME_EVENTS.completeLevel)

    // Общая очистка
    gsap.killTweensOf('*')
    gsap.globalTimeline.clear()
    Locator.uiLayer.destroyStateUiLayerChildren()
    // view destroy
    this.#view?.destroy({children: true})
    this.#view = null
    this.#game.view = null

    if (this.stateStartScreen) {
      this.stateStartScreen?.setInteractive(false)
    }

    this.stateStartScreen = null
    this.isInitialized = false
  }
}
