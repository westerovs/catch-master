import i18next from 'i18next'
import type {Container, Text} from 'pixi.js'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.ts'
import {TIMER_LABELS} from '../../ui/level/clock/Timer.ts'
import DateUtils from '../../utils/DateUtils.ts'
import GameUtils from '../../utils/gameUtils/GameUtils.ts'
import RewardTimer from './RewardTimer.ts'

type TimerText = Text & {
  initText: string
  initFontSize: number
  initPosX: number
}

type HintStorageKey = typeof STORAGE_KEYS.hints | typeof STORAGE_KEYS.hintDarts | typeof STORAGE_KEYS.hintCompass

export default class BtnRewardTimer extends RewardTimer {
  static instance: BtnRewardTimer | undefined

  #priceText!: TimerText
  #iconPlay!: Container
  declare initiatorName: string
  declare btn: Container
  declare btnHintName: HintStorageKey | null

  constructor() {
    super()

    if (typeof BtnRewardTimer.instance === 'object') {
      return BtnRewardTimer.instance
    }

    BtnRewardTimer.instance = this
    return BtnRewardTimer.instance
  }

  init(btn: Container, initiatorName = '', btnHintName: HintStorageKey | null) {
    this.initiatorName = initiatorName
    this.btnHintName = btnHintName

    this.initTimer(btn, this.timerLabel, this.dataTimerKey)

    this.#initializeTextProperties()
    this.#checkTime()
  }

  get dataTimerKey() {
    if (this.btnHintName === STORAGE_KEYS.hints) return STORAGE_KEYS.timer_RewardMagnifier
    if (this.btnHintName === STORAGE_KEYS.hintDarts) return STORAGE_KEYS.timer_RewardDarts
    if (this.btnHintName === STORAGE_KEYS.hintCompass) return STORAGE_KEYS.timer_RewardCompass
    return null
  }

  get timerLabel() {
    if (!this.btnHintName) return TIMER_LABELS.btnFreeTimer

    return `${TIMER_LABELS.btnFreeTimer}_${this.btnHintName}`
  }

  #checkTime = async () => {
    const seconds = await this.findServerTime()
    if (seconds && seconds > 0) {
      this.#updateTimerText(seconds)
    }
  }

  #initializeTextProperties = () => {
    this.#iconPlay = this.btn.getChildByLabel('iconPlay') as Container
    this.#priceText = this.btn.getChildByLabel('priceText') as TimerText

    const priceText = this.#priceText
    priceText.initText = priceText.text
    priceText.initFontSize = priceText.style.fontSize
    priceText.initPosX = priceText.x
  }

  onTimerTick(currentTimeWithZero: string | number) {
    this.#updateTimerText(currentTimeWithZero)
  }

  onTimerEnd() {
    super.onTimerEnd()

    if (this.#priceText.destroyed || this.#iconPlay.destroyed) return

    this.#priceText.text = this.#priceText.initText
    this.#priceText.style.fontSize = this.#priceText.initFontSize
    this.#priceText.x = this.#priceText.initPosX
    this.#iconPlay.visible = true
  }

  #updateTimerText = (timeSeconds: string | number) => {
    this.#priceText.style.fontSize = this.initiatorName === 'store' ? 20 : 26
    this.#priceText.position.set(1, 0)
    this.#iconPlay.visible = false

    const {h, m, s} = DateUtils.formatTime(Number(timeSeconds))
    this.#priceText.text = `${h}:${m}:${s}`
  }

  onError(err: unknown) {
    GameUtils.showError(err, {message: `${i18next.t('errors.ad')}`})
  }
}
