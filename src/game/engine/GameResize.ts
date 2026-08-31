import {WORLD} from '@/game/config/constants.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '../Game.ts'
import Locator from './Locator.ts'

export default class GameResize {
  #game: Game
  #lastResizeWidth?: number
  #lastResizeHeight?: number
  #resizeTimer?: ReturnType<typeof setTimeout>
  #prevWidth?: number
  #prevHeight?: number

  constructor(game: Game) {
    this.#game = game

    window.addEventListener('resize', this.#requestResize)
    this.#requestResize()
  }

  public resize = async () => {
    this.#saveCurrentSize()
    this.#resizeRootContainers()
    this.#emitResize()
  }

  get resizeData() {
    const scaleFactor = this.#getScaleFactor()

    return {
      scaleFactor,
      x: +((window.innerWidth - WORLD.WIDTH * scaleFactor) / 2).toFixed(3),
      y: +((window.innerHeight - WORLD.HEIGHT * scaleFactor) / 2).toFixed(3),
      differentX: Math.abs((window.innerWidth - WORLD.WIDTH) / 2),
      differentY: Math.abs((window.innerHeight - WORLD.HEIGHT) / 2),
    }
  }

  #getScaleFactor = () => {
    return +(window.innerHeight / WORLD.HEIGHT).toFixed(3)
  }

  #requestResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight

    // Запоминаем последние полученные значения
    this.#lastResizeWidth = width
    this.#lastResizeHeight = height

    if (this.#resizeTimer) clearTimeout(this.#resizeTimer)

    // Ждем 120мс после последнего resize, чтобы поймать “конечный” размер
    this.#resizeTimer = setTimeout(() => {
      // Проверяем, совпадает ли размер с последним зарегистрированным
      if (window.innerWidth === this.#lastResizeWidth && window.innerHeight === this.#lastResizeHeight) {
        // Делает resize только если реально устаканилось
        if (width !== this.#prevWidth || height !== this.#prevHeight) {
          void this.resize()
        }
      }
    }, 120)
  }

  #saveCurrentSize = () => {
    this.#prevWidth = window.innerWidth
    this.#prevHeight = window.innerHeight
  }

  #resizeRootContainers = () => {
    this.#game?.gameContainer?.resize()
    Locator.uiLayer.resize()
  }

  #emitResize = () => {
    this.#game.emit(GAME_EVENTS.gameResize)
  }
}
