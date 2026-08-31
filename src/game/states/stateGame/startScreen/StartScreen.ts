import {gsap} from 'gsap'
import type {FederatedPointerEvent} from 'pixi.js'
import {GAME_STATES} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import Scoreboard from '@/game/features/scoreboard/Scoreboard.ts'
import ScoreboardView from '@/game/features/scoreboard/ScoreboardView.ts'
import Store from '@/game/features/store/Store.ts'
import StoreView from '@/game/features/store/StoreView.ts'
import YaMetrika from '@/game/modules/metrika/YaMetrika.ts'
import GameLogo from '@/game/ui/startScreen/special/GameLogo.ts'
import {clearTimeLine} from '@/game/utils/animations/gsapUtils.ts'
import type StateGame from '../StateGame.ts'
import GameMenuView from './GameMenuView.ts'
import StateBadgeController from './statBadge/StateBadgeController.ts'

// Класс создаёт главный экран и управляет его интерактивными элементами.

export default class StartScreen {
  declare state: StateGame

  #game = Locator.game
  #refs = this.#game.refs
  #soundManager = Locator.soundManager
  #stage = this.#game.app.stage
  #gameMenu!: GameMenuView
  #gameLogo: GameLogo | null = null

  #backTimeLine = gsap.timeline()

  constructor(state: StateGame) {
    this.state = state

    // setTimeout(() => this.#createStore(), 500)
  }

  public init = () => {
    new StateBadgeController()
    this.#prepare()
    this.#createGameMenu()
    this.#createGameLogo()
  }

  #prepare = () => {
    const {stateUiLayer} = Locator.uiLayer
    stateUiLayer.visible = true
    stateUiLayer.alpha = 1
    Locator.options.setVisibleToggle(true)
    this.#stage.interactiveChildren = true
    this.#game.on(GAME_EVENTS.clearLevel, this.#clear)
  }

  #createGameMenu = () => {
    this.#gameMenu = new GameMenuView()
    this.#refs.gameMenuView = this.#gameMenu
  }

  #createGameLogo = () => {
    const gameLogo = new GameLogo()
    this.#gameLogo = gameLogo

    gameLogo.init().then(() => {
      if (this.#gameLogo !== gameLogo || !gameLogo.view) return
      this.#game.refs.gameLogo = gameLogo.view
    })
  }

  // todo пересмотреть. Похоже на костыль
  setInteractive = (bool: boolean): void => {
    const action = bool ? 'on' : 'off'
    const eventMode = bool ? 'static' : 'none'

    this.#gameMenu.eventMode = eventMode
    this.#gameMenu[action]('pointertap', this.#handleMainMenuClick)

    Locator.options.optionsToggleBtn.eventMode = eventMode
  }

  // -------- handlers
  #handleMainMenuClick = (event: FederatedPointerEvent) => {
    const target = event.target as GameMenuView & {type?: string}

    if (Locator.options.isVisible) return

    if (target.label === 'btnStart') this.#onBtnStartHandler()
    if (target.label === 'btnStore') this.#onBtnStoreHandler()
    if (target.label === 'btnLeaders') this.#onBtnLeaderboardHandler()

    if (target.type === 'button') this.#soundManager.play('sfx_btnClick')
  }

  #onBtnStartHandler = () => {
    YaMetrika.btnStart()

    this.#game.emit(GAME_EVENTS.clearLevel)
    this.state.checkoutState(GAME_STATES.levelPreload)
  }

  #onBtnStoreHandler = async () => {
    YaMetrika.mainScreenBtnStore()
    this.#createStore()
  }

  #onBtnLeaderboardHandler = async () => {
    YaMetrika.btnLeaders()
    this.#createScoreBoard()
  }

  #clear = () => {
    this.#game.off(GAME_EVENTS.clearLevel, this.#clear)
    clearTimeLine(this.#backTimeLine, true)
    this.#gameLogo?.destroy()
    this.#gameLogo = null
  }

  #createStore = () => {
    const view = new StoreView()
    new Store(view)
  }

  #createScoreBoard = () => {
    const view = new ScoreboardView()
    new Scoreboard(view)
  }
}
