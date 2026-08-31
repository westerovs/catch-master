import type {Container} from 'pixi.js'
import {rewardsCatalog} from '../../config/rewardsCatalog.ts'
import Locator from '../../engine/Locator.ts'
import SdkManager from '../../engine/SdkManager.ts'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.ts'
import YaMetrika from '../../modules/metrika/YaMetrika.ts'
import ButtonAnimator from '../../utils/animations/ButtonAnimator.ts'
import {eventToggle} from '../../utils/gameUtils/GameUtils.ts'
import RateUsView from './RateUsView.ts'

export default class RateUs {
  static displayLevelIndex = 4

  #view!: RateUsView
  #btnLater!: Container
  #btnEnter!: Container
  #completePromise!: Promise<void>
  #resolveComplete: (() => void) | null = null

  constructor() {
    this.#init()
  }

  static get checkAvailable() {
    return SdkManager.makeReview?.isAvailable?.() ?? false
  }

  static get userHasRated() {
    return SdkManager.makeReview?.getStatus?.() ?? false
  }

  static get shouldAct() {
    return SdkManager.makeReview?.shouldAct?.() ?? false
  }

  static checkAndShowRateUs = async () => {
    const completedLevelIndex = Locator.storage.playerData.levelIndex - 1
    if (completedLevelIndex !== RateUs.displayLevelIndex) return
    // if (!RateUs.shouldAct) return // не удалять!

    const rateUs = new RateUs()
    await rateUs.show()
  }

  show = async () => {
    this.#setEvents(true)

    const isShown = await this.#view.show()
    if (!isShown) this.#view.destroy()

    await this.#completePromise
  }

  #init = () => {
    this.#view = new RateUsView()
    this.#btnLater = this.#view.getChildByLabel('btnLater', true) as Container
    this.#btnEnter = this.#view.getChildByLabel('btnEnter', true) as Container
    this.#completePromise = new Promise<void>((resolve) => {
      this.#resolveComplete = resolve
    })

    this.#view.once('destroyed', this.#complete)
    ButtonAnimator.initOverHandler([this.#btnLater, this.#btnEnter])
  }

  #setEvents = (isEnabled: boolean) => {
    const toggle = eventToggle(isEnabled)

    this.#btnLater[toggle.gameOnceOff]('pointerup', this.#btnLaterAction)
    this.#btnEnter[toggle.gameOnceOff]('pointerup', this.#btnEnterAction)
  }

  #btnLaterAction = async () => {
    YaMetrika.userReviewClickLater()
    await this.#close()
  }

  #btnEnterAction = async () => {
    YaMetrika.userReviewClickOk()
    await this.#close()
    await this.#makeReview()
  }

  #close = async () => {
    this.#setEvents(false)
    await this.#view.hide()
  }

  #complete = () => {
    if (!this.#resolveComplete) return

    const resolve = this.#resolveComplete
    this.#resolveComplete = null
    resolve()
  }

  /** Награда выдаётся за попытку оставить отзыв независимо от ответа SDK. */
  #makeReview = async () => {
    try {
      this.#giveReward()
      await SdkManager.makeReview?.act?.()
    } catch (err) {
      console.error('[RateUs makeReview]', err)
    }
  }

  #giveReward = () => {
    Locator.storage.addHints(STORAGE_KEYS.hints, rewardsCatalog.rateUsHints.amount)
  }
}
