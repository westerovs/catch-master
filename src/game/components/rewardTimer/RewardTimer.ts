import type {Container} from 'pixi.js'
import {GrayscaleFilter} from 'pixi-filters'
import {rewardsCatalog} from '@/game/config/rewardsCatalog.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import ABTest from '@/game/modules/ABTest.ts'
import Timer from '@/game/ui/level/clock/Timer.ts'

type RewardTimerKey =
  | typeof STORAGE_KEYS.timer_RewardMagnifier
  | typeof STORAGE_KEYS.timer_RewardDarts
  | typeof STORAGE_KEYS.timer_RewardCompass

type HintStorageKey = typeof STORAGE_KEYS.hints | typeof STORAGE_KEYS.hintDarts | typeof STORAGE_KEYS.hintCompass

type TimerTickEvent = {
  label: string
  currentTimeWithZero: string | number
}

type TimerEndEvent = {
  label: string
}

export default class RewardTimer {
  #game = Locator.game
  #storage = Locator.storage
  #isDisabledBtn = false
  #timerLabel = ''
  #timerKey: RewardTimerKey | null = null
  #hasReward = false
  btn: Container | null = null
  btnHintName: HintStorageKey | null = null
  timer: Timer | null = null
  initiatorName = ''
  #duration = ABTest.getTimerRewardDuration()

  protected initTimer(btn: Container, timerLabel: string, timerKey: RewardTimerKey | null) {
    this.btn = btn
    this.btn.on('pointerup', this.#showAd)
    this.#timerLabel = timerLabel
    this.#timerKey = timerKey

    this.#setTimerEvents(true)
    this.#restoreTimerIfActive()
  }

  destroy = () => {
    this.timer?.kill()
    if (this.btn) this.btn.off('pointerup', this.#showAd)
    this.#setTimerEvents(false)
  }

  // Публичные методы, который можно переопределить
  onError(err: unknown) {
    void err
  }

  onTimerEnd() {}

  onTimerTick(currentTimeWithZero: string | number) {
    void currentTimeWithZero
  }

  // ------------- ↓ timer ↓ -------------
  #startTimer = (duration: number) => {
    this.timer = new Timer({
      game: this.#game,
      duration: duration,
      label: this.#timerLabel,
    })
    this.timer.start()
  }

  #checkoutDisabled = (bool: boolean) => {
    const btn = this.btn
    if (!btn) return

    if (bool) {
      this.#isDisabledBtn = true

      const grayscale = new GrayscaleFilter()
      btn.filters = [grayscale]
      btn.eventMode = 'none'
      return
    }

    this.#isDisabledBtn = false
    btn.filters = []
    btn.eventMode = 'static'
  }

  #setTimerEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.Timer.tick, this.#timerTick)
    this.#game[status](GAME_EVENTS.Timer.kill, this.#timerEnd)
  }

  #timerTick = ({label, currentTimeWithZero}: TimerTickEvent) => {
    if (label === this.#timerLabel) {
      this.onTimerTick(currentTimeWithZero)
    }
  }

  #timerEnd = ({label}: TimerEndEvent) => {
    if (label === this.#timerLabel) {
      this.#checkoutDisabled(false)
      this.onTimerEnd()
    }
  }

  // ------------- ↓ time ↓ -------------
  #getServerTime = async () => {
    const serverTime = await SdkManager.getServerTime()
    return Math.floor(serverTime / 1000)
  }

  findServerTime = async () => {
    if (!this.#timerKey) return false

    const savedTime = this.#storage.playerData[this.#timerKey]

    if (savedTime) {
      const currentServerSeconds = await this.#getServerTime()
      const timePassed = currentServerSeconds - savedTime
      // если прошло меньше чем duration сек, блокируем
      return this.#duration - timePassed
    }

    return false
  }

  #restoreTimerIfActive = async () => {
    const remainingTime = await this.findServerTime()

    if (remainingTime) {
      this.#startTimer(remainingTime)
      this.#checkoutDisabled(true)
      return true
    }

    return false
  }

  #saveTime = async () => {
    if (!this.#timerKey) return

    // Сохраняем в нужный таймер серверное время
    this.#storage.playerData[this.#timerKey] = await this.#getServerTime()
    this.#storage.save()
  }

  // ------------- ↓ AD ↓ -------------
  #showAd = () => {
    if (this.#isDisabledBtn) return

    this.#isDisabledBtn = true
    this.#hasReward = false

    SdkManager.showRewarded({
      onRewarded: this.#onRewarded,
      onFinally: this.#onFinally,
      onError: this.onError,
    })
  }

  // --------- rewarded callbacks
  #onRewarded = () => {
    this.#hasReward = true
    this.#game.emit(GAME_EVENTS.AD.onRewarded, this.initiatorName)

    this.#giveReward()

    this.#startTimer(this.#duration)
    this.#checkoutDisabled(true)
    this.#saveTime()
  }

  #giveReward = () => {
    if (this.initiatorName === 'store' && this.btnHintName === STORAGE_KEYS.hints) {
      this.#storage.addHints(STORAGE_KEYS.hints, rewardsCatalog.store.free.amount, true)
      return
    }

    if (this.btnHintName === STORAGE_KEYS.hints) this.#storage.addHints(STORAGE_KEYS.hints, 1, false)
    if (this.btnHintName === STORAGE_KEYS.hintDarts) this.#storage.addHints(STORAGE_KEYS.hintDarts, 1, false)
    if (this.btnHintName === STORAGE_KEYS.hintCompass) this.#storage.addHints(STORAGE_KEYS.hintCompass, 1, false)

    Locator.storage.save(true)
  }

  #onFinally = () => {
    this.#isDisabledBtn = false
  }
}
