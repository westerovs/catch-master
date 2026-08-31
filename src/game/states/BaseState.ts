import type {Container} from 'pixi.js'
import {GAME_STATES} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'

export default class BaseState {
  isInitialized = false
  game: Game
  view: Container | null = null

  get initEventName(): string {
    return GAME_STATES.baseState
  }

  constructor(game: Game) {
    this.game = game
    this.game.on(this.initEventName, this.checkInitialize)
  }

  checkInitialize = () => {
    if (this.isInitialized) return
    this.initialize()
  }

  initialize() {
    this.game.stateName = this.initEventName
    this.game.setCurrentState(this)
    this.game.emit(GAME_EVENTS.checkoutState, this.initEventName)
  }

  checkoutState(stateName: string) {
    void stateName
    Locator.soundManager.stopAll()
    Locator.options.setVisibleToggle(false)
  }

  update() {}

  resize() {}

  terminate() {}
}
