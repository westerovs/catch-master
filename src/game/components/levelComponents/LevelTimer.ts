import type {Ticker} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'

// Класс ведёт обратный отсчёт времени раунда и сообщает о его завершении.

type TimeChangedHandler = (seconds: number) => void

export default class LevelTimer {
  #game = Locator.game
  #onTimeChanged: TimeChangedHandler
  #remainingMS: number
  #displayedSeconds = -1
  #isRunning = false

  constructor(durationSeconds: number, onTimeChanged: TimeChangedHandler) {
    this.#remainingMS = durationSeconds * 1000
    this.#onTimeChanged = onTimeChanged
  }

  public start() {
    if (this.#isRunning) return

    this.#isRunning = true
    this.#updateDisplayedTime()
    this.#game.app.ticker.add(this.#update, this)
  }

  public destroy() {
    if (!this.#isRunning) return

    this.#game.app.ticker.remove(this.#update, this)
    this.#isRunning = false
  }

  #update(ticker: Ticker) {
    this.#remainingMS = Math.max(0, this.#remainingMS - ticker.deltaMS)
    this.#updateDisplayedTime()
    if (this.#remainingMS > 0) return

    this.destroy()
    this.#game.emit(GAME_EVENTS.LEVEL.timeExpired)
  }

  #updateDisplayedTime() {
    const seconds = Math.ceil(this.#remainingMS / 1000)
    if (seconds === this.#displayedSeconds) return

    this.#displayedSeconds = seconds
    this.#onTimeChanged(seconds)
  }
}
