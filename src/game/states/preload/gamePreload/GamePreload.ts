import i18next from 'i18next'
import {Assets, type Text} from 'pixi.js'
import GamePause from '@/game/components/GamePause.ts'
import {GAME_STATES, PLATFORM_ID} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager, {type SdkAdapter} from '@/game/engine/SdkManager.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import LocaleManager from '@/game/modules/LocaleManager.ts'
import GameTimeTrackerCounter from '@/game/modules/metrika/GameTimeTrackerCounter.ts'
import YaMetrika, {ERROR_TYPES} from '@/game/modules/metrika/YaMetrika.ts'
import BaseState from '@/game/states/BaseState.ts'
import {createPreloadList} from '@/game/states/preload/gamePreload/preloadList.ts'
import PreloadView from '@/game/states/preload/PreloadView.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.ts'
import Logger from '@/game/utils/Logger.ts'
import AdminPanelButton from '@/game/utils/testing/adminPanel/AdminPanelButton.ts'
import DebugHotkeys from '@/game/utils/testing/DebugHotkeys.ts'
import DebugInfo from '@/game/utils/testing/DebugInfo.ts'

/*
 * Класс предзагружает ресурсы необходимые для показа стартового окна
 * + фоном догружает аудио
 * */

export default class GamePreload extends BaseState {
  readonly #adapter: SdkAdapter
  readonly #maxLoadAttempts = 3

  #view: PreloadView | null = null
  #preloadText: Text | null = null
  #startTime: number | null = null
  #loadAttempts = 0

  constructor(game: Game, adapter: SdkAdapter) {
    super(game)

    this.#adapter = adapter
  }

  get initEventName() {
    return GAME_STATES.preloadState
  }

  async initialize() {
    super.initialize()
    this.#startTime = performance.now()

    this.#initView()
    await Locator.gameResize.resize()

    const isLoaded = await this.#load()
    if (!isLoaded) return

    await this.#startGame()
    this.#postStartActions()
  }

  #load = async () => {
    this.#loadAttempts = 0

    while (this.#loadAttempts < this.#maxLoadAttempts) {
      try {
        await this.#loadSdkAndLocales(40)
        this.#startLevelConfigurationLoading()
        await this.#loadStorageAndPayments(50)

        await this.#loadGameBundle(80)

        await this.#createUiSpriteSheet()
        this.#updateProgressView(100)
        return true
      } catch (err) {
        const canRetry = await this.#handleLoadError(err)
        if (!canRetry) return false
      }
    }

    return false
  }

  #handleLoadError = async (err: unknown) => {
    console.error('[GamePreload]: loading failed', err)
    this.#loadAttempts++

    // Показываем статус + ждём задержку, увеличивая её на каждую попытку
    await GameUtils.showTextPreloadAttempts(this.#preloadText, this.#loadAttempts, this.#maxLoadAttempts, err)

    if (this.#loadAttempts < this.#maxLoadAttempts) return true
    console.error('[GamePreload]: loading attempts exhausted', err)
    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.initialize, err)

    return false
  }

  #loadGameBundle = async (progress: number) => {
    await Assets.init({manifest: createPreloadList()})
    await Assets.loadBundle('gameScreen')

    this.#updateProgressView(progress)
  }

  // load step1
  #loadSdkAndLocales = async (progress: number) => {
    const sdkPromise = SdkManager.initSdk(this.#adapter)
    const localesPromise = Locator.gameConfig.loadLocalesJson()

    await Promise.all([sdkPromise, localesPromise])

    await LocaleManager.init()
    Locator.gameConfig.locale = LocaleManager.locale

    this.#updateProgressView(progress)
  }

  // load step2
  #loadStorageAndPayments = async (progress: number) => {
    await Locator.storage.load()
    await Locator.paymentManager.consumePendingPayments()
    this.#updateProgressView(progress)
  }

  // фоновая загрузка, в levelPreload/InitialLoad дожидается, если вдруг не успела загрузиться
  #startLevelConfigurationLoading = () => {
    Locator.gameConfig.loadLevelConfiguration().catch((error: unknown) => {
      console.warn('[GamePreload: фоновая загрузка конфигурации уровня не завершена]', error)
    })
  }

  #initView = () => {
    this.#view = new PreloadView()
    this.game.gameContainer.addChild(this.#view)
    this.#updateProgressView(0)

    this.isInitialized = true
  }

  #updateProgressView = (progress: number) => {
    const preloadText = this.#view?.refs?.preloadText
    if (!this.#view || !preloadText) return

    const isDetectI18text = i18next.t('textLoading') || ''
    const textValue = isDetectI18text ? `${isDetectI18text} ${progress}%` : ''

    preloadText.text = `${textValue}`
    preloadText.style.fontFamily = 'primaryFont'
    this.#preloadText = preloadText
  }

  #createUiSpriteSheet = async () => {
    await LoadUtils.loadSpriteSheet({spriteSheetName: 'startScreenUi'})
  }

  #startGame = async () => {
    this.terminate()
    new AdminPanelButton(this.game, Locator.storage, Locator.gameConfig)

    Locator.options.init()

    if (SdkManager.flags?.skipFirstScreen) {
      this.game.emit(GAME_STATES.levelPreload)
      return
    }

    this.game.emit(this.game.stateAfterPreload)
  }

  #showAd = () => {
    if (SdkManager.isPlatform(PLATFORM_ID.cg)) return
    if (SdkManager.flags?.noPreroll || GameUtils.isFirstLevel) return
    if (!Locator.storage.playerData.hasAdPass) SdkManager.showInterstitial()
  }

  terminate() {
    this.game.emit(GAME_EVENTS.clearLevel)

    this.#view?.destroy({children: true})
    this.#view = null

    this.isInitialized = false
  }

  #postStartActions = () => {
    if (this.#startTime === null) {
      console.error('[GamePreload]: loading start time was not recorded, metric skipped')
    } else {
      const loadDuration = GameUtils.checkLoadTime(this.#startTime)
      YaMetrika.loadDuration(loadDuration)
    }

    // если понадобится второй шрифт, грузить фоном
    // Assets.backgroundLoadBundle(['secondaryFont'])

    Locator.soundManager.init()
    Locator.soundManager.preloadSFXFMain() // фоновая загрузка SFX

    new GameTimeTrackerCounter()

    if (LocalStorage.isDebug) {
      new DebugInfo(this.game)
      new DebugHotkeys()
    }

    this.#initGamePause()
    this.#showAd()

    Logger.log('[SdkManager] flags:', SdkManager.flags)
  }

  #initGamePause = () => {
    new GamePause()
  }
}
