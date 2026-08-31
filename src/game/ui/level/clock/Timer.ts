import {gsap} from 'gsap'
import Locator from '../../../engine/Locator.ts'
import {GAME_EVENTS} from '../../../events/gameEvents.ts'
import type Game from '../../../Game.ts'

// just IDs to create unique timers.
export const TIMER_LABELS = {
  btnHintRewardTimer: 'btnHintRewardTimer',
  btnFreeTimer: 'btnFreeTimer',
  adLvlTimer: 'adLvlTimer',
  compassTimer: 'compassTimer',
}

type TimerOptions = {
  game?: Game
  duration?: number
  log?: boolean
  label?: string
}

export default class Timer {
  declare game: Game
  declare duration: number
  declare log: boolean
  declare label: string
  declare remainingTime: number
  declare timerTween: ReturnType<typeof gsap.to> | null

  constructor({game = Locator.game, duration = 0, log = false, label = 'defaultTimer'}: TimerOptions = {}) {
    this.game = game
    this.duration = Math.floor(duration)
    this.log = log
    this.label = label
    this.remainingTime = this.duration
    this.timerTween = null

    this.game.on(GAME_EVENTS.completeLevel, this.kill.bind(this))
    this.game.on(GAME_EVENTS.clearLevel, this.kill.bind(this))
  }

  async start() {
    let lastTime = Math.ceil(this.remainingTime)

    return (this.timerTween = gsap.to(this, {
      remainingTime: 0,
      duration: this.duration,
      ease: 'none',
      onUpdate: () => {
        const currentTime = Math.ceil(this.remainingTime)

        if (currentTime !== lastTime) {
          lastTime = currentTime
          this.#tick(currentTime)
        }
      },
      onComplete: () => {
        this.kill()
      },
    }))
  }

  kill() {
    if (this.timerTween) {
      this.timerTween.kill()
      this.timerTween = null

      this.game.off(GAME_EVENTS.completeLevel, this.kill)
      this.game.off(GAME_EVENTS.clearLevel, this.kill)
      this.game.emit(GAME_EVENTS.Timer.kill, {label: this.label})
    }
  }

  #tick(currentTime: number) {
    if (this.log) console.log(`[Timer] ${this.label} tick`, currentTime)

    this.game.emit(GAME_EVENTS.Timer.tick, {
      label: this.label,
      currentTime,
      currentTimeWithZero: currentTime > 9 ? currentTime : `0${currentTime}`,
    })
  }
}
