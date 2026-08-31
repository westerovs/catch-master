import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'

// Класс считает очки уровня и сообщает об изменении результата.

type ScoreChangedHandler = (score: number) => void

export default class LevelScore {
  #game = Locator.game
  #onScoreChanged: ScoreChangedHandler
  #score = 0

  constructor(onScoreChanged: ScoreChangedHandler) {
    this.#onScoreChanged = onScoreChanged
  }

  get score() {
    return this.#score
  }

  public init() {
    this.#game.on(GAME_EVENTS.LEVEL.dropCaught, this.#addPoints, this)
  }

  public destroy() {
    this.#game.off(GAME_EVENTS.LEVEL.dropCaught, this.#addPoints, this)
  }

  #addPoints(points: number) {
    this.#score = Math.max(0, this.#score + points)
    this.#onScoreChanged(this.#score)
  }
}
