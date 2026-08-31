import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Text} from 'pixi.js'
import {GAME_STATES} from '@/game/config/constants.ts'
import {getLevelDifficultyConfig} from '@/game/config/levelDifficulty.ts'
import {rewardsCatalog} from '@/game/config/rewardsCatalog.ts'
import type SoundManager from '@/game/engine/audio/SoundManager.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import type Storage from '@/game/engine/storage/Storage.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import RateUs from '@/game/features/rateUs/RateUs.ts'
import Store from '@/game/features/store/Store.ts'
import StoreView from '@/game/features/store/StoreView.ts'
import YaMetrika from '@/game/modules/metrika/YaMetrika.ts'
import type Level from '@/game/states/stateLevel/Level.ts'
import type StateLevel from '@/game/states/stateLevel/StateLevel.ts'
import Confetti from '@/game/ui/common/emitters/confetti/Confetti.ts'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.ts'
import {clearTimeLine} from '@/game/utils/animations/gsapUtils.ts'
import GrayscaleFilter from '@/game/utils/filters/GrayscaleFilter.ts'
import BtnBadge from './BtnBadge.ts'
import CompleteLevelView from './CompleteLevelView.ts'

// Класс управляет экраном завершения уровня.

type CompleteLevelResult = {
  score: number
  maxScore: number
  isNewRecord: boolean
}

export default class CompleteLevel {
  declare levelEntity: Level
  declare state: StateLevel
  declare btnBuyLoupe: Container | null
  declare btnHome: Container
  declare btnByeAd: Container | null
  declare btns: Container[]

  #game = Locator.game
  #refs = this.#game.refs
  #confetti = new Confetti()
  #view!: CompleteLevelView
  #storage!: Storage
  #soundManager!: SoundManager
  #btnNext!: Container
  #btnReplay!: Container
  #showTimeline: gsap.core.Timeline | null = null

  constructor(levelEntity: Level) {
    this.levelEntity = levelEntity
    this.state = levelEntity.state
  }

  init = async ({score, maxScore, isNewRecord}: CompleteLevelResult) => {
    try {
      this.#storage = Locator.storage
      this.#soundManager = Locator.soundManager

      const isViewReady = this.#initViewElements()
      if (!isViewReady) {
        await this.state.runNextLevel()
        return
      }

      this.#view.setResult({score, maxScore, isNewRecord})

      this.#setEvents(true)

      await this.#setPriceTextForBtnAd()

      this.#createBtnBadge()
      this.#setBtnNextValue()
      this.#checkAdPassPurchased()
      await RateUs.checkAndShowRateUs()

      this.#showConfetti()
      await this.#showAndAnimate()
      SdkManager.gameplayStop()
    } catch (err) {
      console.error('[CompleteLevel]: initialization failed', err)
    }
  }

  #initViewElements = () => {
    const view = this.#refs.completeLevelView
    if (!(view instanceof CompleteLevelView)) {
      console.error('[CompleteLevel]: completion screen is missing, advanced to the next level')
      return false
    }

    const btnNext = this.#getRequiredContainer(view, 'btnNext', true)
    const btnReplay = this.#getRequiredContainer(view, 'btnReplay', true)
    const btnHome = this.#getRequiredContainer(view, 'btnHome', true)
    if (!btnNext || !btnReplay || !btnHome) return false

    this.#view = view
    this.#btnNext = btnNext
    this.#btnReplay = btnReplay
    this.btnBuyLoupe = view.getChildByLabel('btnBuyLoupe', true)
    this.btnHome = btnHome
    this.btnByeAd = view.getChildByLabel('btnByeAd', true)
    this.btns = [this.#btnNext, this.#btnReplay, this.btnHome]
    if (this.btnBuyLoupe) this.btns.push(this.btnBuyLoupe)
    if (this.btnByeAd) this.btns.push(this.btnByeAd)

    ButtonAnimator.initOverHandler(this.btns)
    return true
  }

  #setEvents = (bool: boolean): void => {
    const status = bool ? 'on' : 'off'
    const statusOnce = bool ? 'once' : 'off'

    this.#btnNext[statusOnce]('pointerdown', this.#btnNextHandler)
    this.#btnReplay[statusOnce]('pointerdown', this.#btnReplayHandler)
    this.btnHome[statusOnce]('pointerdown', this.#btnHomeHandler)

    this.#game[status](GAME_EVENTS.clearLevel, this.#clearLevelHandler, this)
    this.#game[status](GAME_EVENTS.STORE.hide, this.#unHideInterface)
    this.#game[status](GAME_EVENTS.paymentManager.hasNoAdsPass, this.#checkAdPassPurchased)

    if (this.btnBuyLoupe) this.btnBuyLoupe[status]('pointertap', this.#btnStoreHandler)
    if (this.btnByeAd) this.btnByeAd[status]('pointertap', this.#btnByeAd)
  }

  // 1 ------------- level result
  #showAndAnimate = async () => {
    const btnNext = this.#btnNext
    this.#view.visible = true

    try {
      const btnNextArrow = this.#getRequiredContainer(btnNext, 'btnNextArrow')
      if (!btnNextArrow) {
        btnNext.eventMode = 'static'
        return
      }

      const btnBadge = btnNext.getChildByLabel('btnBadge')

      this.#showTimeline = gsap
        .timeline()
        .call(async () => {
          await this.#soundManager.stopAll()
          await this.#soundManager.play('sfx_victory')
          this.#soundManager.play('m_victory')
        })
        .fromTo(this.#view, {alpha: 0}, {alpha: 1})

      const newRecordText = this.#view.getChildByLabel('levelNewRecord', true)
      if (newRecordText?.visible) {
        this.#showTimeline.fromTo(newRecordText.scale, {x: 0, y: 0}, {x: 1, y: 1, duration: 0.65, ease: 'elastic.out(1, 0.35)'}, '<0.15')
      }

      this.#showTimeline
        .set(btnNext, {eventMode: 'none'})
        .fromTo(btnNext.scale, {x: 0, y: 0}, {x: 1, y: 1, ease: 'back.out(2.5)'})
        .from(btnNextArrow, {x: '-=150', alpha: 0, duration: 0.3, delay: 0.2, ease: 'elastic.out(0.5, 0.3)'}, '<')

      if (btnBadge) {
        this.#showTimeline.set(btnBadge, {visible: true}).fromTo(btnBadge.scale, {x: 0, y: 1}, {x: 1, y: 1, ease: 'back.out(2.5)'})
      }

      this.#showTimeline.set(btnNext, {eventMode: 'static'})
    } catch (err) {
      btnNext.eventMode = 'static'
      console.error('[CompleteLevel]: completion screen animation failed', err)
    }
  }

  #setBtnNextValue = () => {
    const btnNextArrow = this.#getRequiredContainer(this.#btnNext, 'btnNextArrow')
    if (!btnNextArrow) return

    const arrowText = this.#getRequiredText(btnNextArrow, 'arrowText')
    if (!arrowText) return

    const nextUserLevel = this.#storage.userLevel
    arrowText.text = `${i18next.t('level')} ${nextUserLevel}`
  }

  #showConfetti = () => {
    this.#confetti.init()
    this.#confetti.play()
  }

  #createBtnBadge = () => {
    const {levelType} = getLevelDifficultyConfig(this.#storage.userLevel)
    if (!levelType.difficulty) return

    const badge = new BtnBadge({type: levelType})
    this.#btnNext.addChild(badge)
  }

  #hideInterface = () => {
    this.#view.interactiveChildren = false

    return gsap.timeline().to(this.#view, {alpha: 0, visible: false})
  }

  #unHideInterface = () => {
    this.#view.interactiveChildren = true

    return gsap.timeline().to(this.#view, {alpha: 1, visible: true})
  }

  #btnNextHandler = async () => {
    YaMetrika.finalScreenBtnNext()
    this.#setEvents(false)
    clearTimeLine(this.#showTimeline, true, 1)

    await this.state.runNextLevel()
  }

  #btnReplayHandler = async () => {
    this.#setEvents(false)
    clearTimeLine(this.#showTimeline, true, 1)

    await this.state.restart()
  }

  #btnHomeHandler = async () => {
    YaMetrika.finalScreenBtnHome()

    this.#setEvents(false)
    this.#soundManager.play('sfx_btnClick')
    await ButtonAnimator.click(this.btnHome)
    this.state.checkoutState(GAME_STATES.gameState)
  }

  #btnStoreHandler = () => {
    YaMetrika.finalScreenBtnStore()

    this.#soundManager.play('sfx_btnClick')
    this.#hideInterface()
    this.#createStore()
  }

  // todo дублирование
  #createStore = () => {
    const view = new StoreView()
    new Store(view)
  }

  #btnByeAd = () => {
    YaMetrika.finalScreenBtnDisableAd()
    const id = rewardsCatalog.store.noAdPack.id

    const paymentManager = Locator.paymentManager
    paymentManager.onPurchase(id)
  }

  #setPriceTextForBtnAd = async () => {
    if (!this.btnByeAd) return

    const btnByeAdText = this.btnByeAd.getChildByLabel('btnByeAdText') as Text
    if (!btnByeAdText) return

    try {
      const catalog = await SdkManager.purchase.getCatalog()
      if (!catalog || catalog?.length) return

      const adPackId = rewardsCatalog.store.noAdPack.id
      const data = catalog[adPackId]

      const currency = SdkManager.purchase.getCurrency()

      btnByeAdText.text = `${data.price}\n${currency}`
    } catch (err) {
      console.log('[setPriceTextForBtnAd]', err)
      btnByeAdText.text = ''
    }
  }

  #checkAdPassPurchased = () => {
    const card = this.btnByeAd
    if (this.#storage.playerData.hasAdPass && card) {
      card.eventMode = 'none'

      const grayscale = new GrayscaleFilter(1)
      card.filters = [grayscale]

      const btnByeAdText = card.getChildByLabel('btnByeAdText')
      if (btnByeAdText) btnByeAdText.visible = false
    }
  }

  #getRequiredContainer = (parent: Container, label: string, deep = false) => {
    const child = parent.getChildByLabel(label, deep)
    if (!child) {
      console.error(`[CompleteLevel]: element ${label} not found, related action skipped`)
      return null
    }

    return child
  }

  #getRequiredText = (parent: Container, label: string) => {
    const child = this.#getRequiredContainer(parent, label)
    if (!child) return null
    if (!(child instanceof Text)) {
      console.error(`[CompleteLevel]: element ${label} is not text, update skipped`)
      return null
    }

    return child
  }

  #clearLevelHandler() {
    this.#setEvents(false)
  }
}
