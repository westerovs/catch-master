import {Container, Graphics} from 'pixi.js'
import {GAME_STATES, WORLD} from '@/game/config/constants.ts'
import type GameConfig from '@/game/config/GameConfig.ts'
import Locator from '@/game/engine/Locator.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.ts'
import type Storage from '@/game/engine/storage/Storage.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import AdminPanel from '@/game/utils/testing/adminPanel/AdminPanel.ts'

type AdminButtonSide = 'left' | 'right'

/*
 * Алгоритм работы: 3 клика по левой, 3 клика по правой, 1 клик по левой.
 * */

export default class AdminPanelButton {
  #game: Game
  #storage: Storage
  #gameConfig: GameConfig

  #size = 100
  #parent: Container
  #firstButton: Graphics | null = null
  #secondButton: Graphics | null = null

  #clicks: AdminButtonSide[] = []
  #pattern: AdminButtonSide[] = ['left', 'left', 'left', 'right', 'right', 'right', 'left']
  #resetTimeout = 4000
  #resetTimer: ReturnType<typeof setTimeout> | null = null

  constructor(game: Game, storage: Storage, gameConfig: GameConfig) {
    this.#game = game
    this.#storage = storage
    this.#gameConfig = gameConfig
    this.#parent = Locator.uiLayer.globalUiLayer

    this.#setEvents(true)

    // test
    // this.#createAdminPanel()
  }

  #createButtons = () => {
    this.#firstButton = this.#createButton(this.#parent, {x: 0, y: WORLD.HEIGHT - this.#size})
    this.#firstButton.on('pointerup', this.#onPointerFirstBtn)

    this.#secondButton = this.#createButton(this.#parent, {
      x: Locator.uiLayer.uiData.width - this.#size,
      y: WORLD.HEIGHT - this.#size,
    })
    this.#secondButton.on('pointerup', this.#onPointerSecondBtn)

    this.#resize()
  }

  #createButton = (parent: Container, {x, y}: {x: number; y: number}) => {
    const isVisible = LocalStorage.isDebug ? 0.3 : 0

    const button = new Graphics({label: 'adminBtn'})
    button.alpha = isVisible
    button.rect(0, 0, this.#size, this.#size).fill(0xff0000)
    button.eventMode = 'static'
    button.position.set(x, y)
    parent.addChild(button)

    return button
  }

  #resize = () => {
    if (!this.#secondButton) return
    this.#secondButton.x = Locator.uiLayer.uiData.width - this.#size
  }

  #setEvents = (bool: boolean): void => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.checkoutState, this.#showAndHideButtons)
    this.#game[status](GAME_EVENTS.gameResize, this.#resize)
  }

  #showAndHideButtons = () => {
    if (this.#game.stateName === GAME_STATES.gameState) {
      this.#createButtons()
      this.#game.on(GAME_EVENTS.gameResize, this.#resize)
    }
    if (this.#game.stateName === GAME_STATES.levelState) {
      if (!this.#firstButton && !this.#secondButton) return

      this.#firstButton?.off('pointerup', this.#onPointerFirstBtn)
      this.#secondButton?.off('pointerup', this.#onPointerSecondBtn)
      this.#game.off(GAME_EVENTS.gameResize, this.#resize)

      this.#firstButton?.destroy()
      this.#secondButton?.destroy()
      this.#firstButton = null
      this.#secondButton = null
    }
  }

  #onPointerFirstBtn = () => this.#registerClick('left')

  #onPointerSecondBtn = () => this.#registerClick('right')

  #registerClick(btn: AdminButtonSide) {
    this.#clicks.push(btn)

    if (this.#resetTimer) clearTimeout(this.#resetTimer)
    this.#resetTimer = setTimeout(() => (this.#clicks = []), this.#resetTimeout)

    if (this.#clicks.length > this.#pattern.length) {
      this.#clicks.shift()
    }

    if (this.#clicks.join(',') === this.#pattern.join(',')) {
      this.#clicks = []
      this.#createAdminPanel()
    }
  }

  #createAdminPanel = () => {
    new AdminPanel()
  }
}
