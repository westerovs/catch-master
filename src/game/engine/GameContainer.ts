import {Container} from 'pixi.js'
import {WORLD} from '@/game/config/constants.ts'
import type Game from '../Game.ts'
import DebugRect from '../utils/debug/DebugRect.ts'
import Locator from './Locator.ts'

/**
 * Специальный контейнер для стейтов, который центрируется и масштабируется относительно центра экрана
 * и всегда занимает ширину и высоту всего мира.
 */

export default class GameContainer extends Container {
  declare game: Game

  #debugRect: DebugRect | null = null
  #isDebug = false

  constructor(game: Game) {
    super({label: 'GameContainer', sortableChildren: true})

    this.game = game
    this.#init()
  }

  resize = () => {
    const {scaleFactor, x, y} = Locator.gameResize.resizeData
    this.scale.set(scaleFactor)
    this.position.set(x, y)

    this.#updateDebugRect()
  }

  #init() {
    this.#createDebugRect()
  }

  #createDebugRect() {
    if (!this.#isDebug) return

    this.#debugRect = new DebugRect({
      color: 0xff0000,
      label: 'GameContainerDebugRect',
    })
    this.#debugRect.zIndex = 2
    this.addChild(this.#debugRect)
    this.#updateDebugRect()
  }

  #updateDebugRect() {
    if (!this.#isDebug) return

    this.#debugRect?.update({
      width: WORLD.WIDTH,
      height: WORLD.HEIGHT,
      scale: this.scale.x,
    })
  }
}
