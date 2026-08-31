import {GAME_STATES} from '../../config/constants.ts'
import Locator from '../../engine/Locator.ts'
import {GAME_EVENTS} from '../../events/gameEvents.ts'
import StateLevel from '../../states/stateLevel/StateLevel.ts'
import GameUtils from '../gameUtils/GameUtils.ts'
import AdminPanel from './adminPanel/AdminPanel.ts'

export default class DebugHotkeys {
  #game = Locator.game

  constructor() {
    this.#init()
  }

  #init = () => {
    const {userLevel} = Locator.storage.playerData

    GameUtils.showPopUp(`level ${userLevel}`)
    window.addEventListener('keydown', this.#onKeysHandler)
  }

  #onKeysHandler = (event: KeyboardEvent) => {
    if (event.repeat) return
    const numKey = parseInt(event.key)
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const tag = target.tagName

    this.#showAdminPanel(numKey)

    if (this.#game.stateName !== GAME_STATES.levelState) return
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return

    this.#runFastWin(numKey)
    this.#runNextLevel(numKey)
  }

  #showAdminPanel = (numKey: number) => {
    if (numKey === 0) {
      if (!document.querySelector('.admin-panel__bg')) {
        new AdminPanel()
      }
    }
  }

  #runFastWin = (numKey: number) => {
    if (numKey === 8) {
      setTimeout(() => this.#game.emit(GAME_EVENTS.completeLevelWin), 0)
      GameUtils.showPopUp('fast win')
    }
  }

  #runNextLevel = (numKey: number) => {
    if (numKey === 9) {
      const currentState = this.#game.currentState
      if (!(currentState instanceof StateLevel)) return

      this.#game.emit(GAME_EVENTS.LEVEL.forceNextLevel)
      GameUtils.showPopUp('next level')
      setTimeout(() => currentState.runNextLevel(), 100)
    }
  }
}
