import {Application, type Container, EventEmitter} from 'pixi.js'
import {GAME_STATES} from '@/game/config/constants.ts'
import GameConfig from '@/game/config/GameConfig.ts'
// import {getGameResolution} from '@/game/config/resolutionConfig.mjs'
import SoundManager from '@/game/engine/audio/SoundManager.ts'
import GameContainer from '@/game/engine/GameContainer.ts'
import GameResize from '@/game/engine/GameResize.ts'
import Locator, {SERVICES} from '@/game/engine/Locator.ts'
import type {SdkAdapter} from '@/game/engine/SdkManager.ts'
import Storage from '@/game/engine/storage/Storage.ts'
import UiLayer from '@/game/engine/uiLayer/UiLayer.ts'
import PaymentManager from '@/game/modules/PaymentManager.ts'
import type BaseState from '@/game/states/BaseState.ts'
import GamePreload from '@/game/states/preload/gamePreload/GamePreload.ts'
import LevelPreload from '@/game/states/preload/levelPreload/LevelPreload.ts'
import StateGame from '@/game/states/stateGame/StateGame.ts'
import StateLevel from '@/game/states/stateLevel/StateLevel.ts'
import Options from '@/game/ui/common/options/Options.ts'

// todo уйти от refs во всём коде

export default class Game extends EventEmitter {
  declare refs: Record<string, any>
  readonly #stateAfterPreload = GAME_STATES.levelPreload
  readonly #adapter: SdkAdapter

  #app!: Application
  #currentState: BaseState | null = null
  #gameContainer!: GameContainer
  #stateName: string | null = null
  #view: Container | null = null // у каждого стейта есть view-контейнер

  constructor(adapter: SdkAdapter) {
    super()

    this.#adapter = adapter
  }

  get app() {
    return this.#app
  }

  get currentState() {
    return this.#currentState
  }

  get gameContainer() {
    return this.#gameContainer
  }

  get stateAfterPreload() {
    return this.#stateAfterPreload
  }

  get stateName() {
    return this.#stateName
  }

  set stateName(stateName) {
    this.#stateName = stateName
  }

  get view() {
    return this.#view
  }

  set view(view) {
    this.#view = view
  }

  setCurrentState(state: BaseState) {
    this.#currentState = state
  }

  init = async () => {
    this.#registerServices()
    await this.#createApp()
    this.#initResize()
    this.#createGameLayers()
    this.#initGameStates()
    this.#start()
  }

  #createApp = async () => {
    this.#app = new Application()

    await this.#app.init({
      resizeTo: window,
      autoDensity: true,
      backgroundColor: 0x000000,
      backgroundAlpha: 1,
      // resolution: getGameResolution(window.devicePixelRatio),
      antialias: false,
      preference: 'webgl',
    })

    const wrapper = document.body.querySelector<HTMLElement>('#canvas-wrapper')
    if (!wrapper) {
      console.error('[Game]: #canvas-wrapper container not found, canvas appended to body')
      document.body.appendChild(this.#app.canvas)
      return
    }

    wrapper.appendChild(this.#app.canvas)
  }

  #initResize = () => {
    Locator.register(SERVICES.GAME_RESIZE, new GameResize(this))
  }

  #createGameLayers = () => {
    this.#gameContainer = new GameContainer(this)
    this.#app.stage.addChild(this.#gameContainer)

    this.#gameContainer.addChild(Locator.uiLayer)
  }

  // todo переделать, не нужно тут всё объявлять.
  #initGameStates = () => {
    new GamePreload(this, this.#adapter)
    new LevelPreload(this)
    new StateGame(this)
    new StateLevel(this)
  }

  #registerServices = () => {
    Locator.register(SERVICES.GAME, this)
    Locator.register(SERVICES.UI_LAYER, new UiLayer())
    Locator.register(SERVICES.STORAGE, new Storage(this))
    Locator.register(SERVICES.GAME_CONFIG, new GameConfig())
    Locator.register(SERVICES.PAYMENT_MANAGER, new PaymentManager(this))
    Locator.register(SERVICES.OPTIONS, new Options(this))
    Locator.register(SERVICES.SOUND_MANAGER, new SoundManager(this))
  }

  #start() {
    this.emit(GAME_STATES.preloadState)
  }
}
