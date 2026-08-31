import {gsap} from 'gsap'
import {GAME_STATES} from '@/game/config/constants.ts'
import type Game from '@/game/Game.ts'
import type LevelPreload from '@/game/states/preload/levelPreload/LevelPreload.ts'
import type PreloadView from '@/game/states/preload/PreloadView.ts'

// [STATE 4] Завершение и переход к следующему игровому состоянию

export default class Finalize {
  #levelEntity: LevelPreload
  #view: PreloadView | null
  #game: Game

  constructor(levelEntity: LevelPreload) {
    if (!levelEntity.view) console.error('[Finalize]: level preload screen is missing, hiding skipped')

    this.#levelEntity = levelEntity
    this.#game = levelEntity.game
    this.#view = levelEntity.view
  }

  // ---------------------------------------------------
  // [STATE] Завершение и переход к следующему игровому состоянию
  startGame = async () => {
    await this.#hidePreload()
    await this.#levelEntity.terminate()
    this.#game.emit(GAME_STATES.levelState)
  }

  #hidePreload = async () => {
    if (!this.#view) return

    await gsap.timeline().to(this.#view, {alpha: 0, delay: 0})
  }
}
