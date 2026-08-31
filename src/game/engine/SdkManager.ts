import {isMobile} from 'pixi.js'
import {DEFAULT_FLAGS, GAME_STATES, PLATFORM_ID} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import CrazyGames from '@/game/engine/special/CrazyGames.ts'
import {DEFAULT_DATA} from '@/game/engine/storage/defaultData.ts'

type InterstitialCallbacks = {
  onOpen?: () => void
  onClosed?: () => void
  onFinally?: () => void
  onError?: (error: unknown) => void
}

type RewardedCallbacks = {
  onOpen?: () => void
  onRewarded?: () => void
  onFinally?: () => void
  onError?: (error: unknown) => void
}

type SdkFlags = Record<string, string | number | boolean | null | undefined>

type SdkCatalogItem = {
  id?: string
  amount?: number
  price?: string | number
  [key: string]: unknown
}

type SdkPurchaseResult = {
  productID: string
  purchaseToken: string
}

type SdkPurchase = {
  isAvailable: () => boolean
  getCurrency: () => string
  getCatalog: () => Promise<Record<string, SdkCatalogItem>>
  buy: (id: string) => Promise<SdkPurchaseResult>
  getPurchases: () => Promise<SdkPurchaseResult[]>
  consumePurchase: (purchaseToken: string) => Promise<unknown>
}

type SdkPlayer = {
  isAuth: () => boolean
  getId: () => string | null
  auth: () => Promise<unknown>
}

type SdkLeaderboard = {
  isAvailable: () => boolean
  getEntries: (maxPlayers: number, maxNeighbors: number) => Promise<unknown[]>
  setScore: (score: number) => Promise<unknown>
}

type SdkReview = {
  isAvailable?: () => boolean
  getStatus?: () => boolean
  shouldAct?: () => boolean
  act?: () => Promise<unknown>
}

type SdkAdvertising = {
  isRewardedAvailableNow: () => boolean
  showInterstitial: () => Promise<unknown>
  showRewarded: () => Promise<unknown>
  showBanner: () => Promise<unknown>
  hideAllAdaptiveBanners: () => void
  debugAdaptiveBanners: () => void
  setAdaptiveBannersAreas: (areas: {x: number; y: number; width: number; height: number}[]) => void
  showAllAdaptiveBanners: () => void
}

type SdkStorage = {
  getLocalStorage: () => globalThis.Storage
  get: (keys: string[]) => Promise<Record<string, unknown>[]>
  set: (data: Record<string, unknown>, force?: boolean) => Promise<unknown>
}

type SdkSession = {
  open: () => Promise<unknown>
  showPopup: () => void
}

type SdkAdapter = {
  readonly isReady: boolean
  options: {flags: SdkFlags}
  advertising: SdkAdvertising
  leaderboard: SdkLeaderboard
  makeReview?: SdkReview
  player: SdkPlayer
  purchase: SdkPurchase
  session: SdkSession
  storage: SdkStorage
  init: () => Promise<unknown>
  on: (eventName: string, callback: () => void) => void
  gameReady: () => void
  gameplayStart: () => void
  gameplayStop: () => void
  getLang: () => string | Promise<string>
  getServerTime: () => number | Promise<number>
  getPlatformId: () => string
}

export default class SdkManager {
  static sdk: SdkAdapter
  static makeReview?: SdkReview
  static leaderboard: SdkLeaderboard
  static purchase: SdkPurchase
  static player: SdkPlayer
  static adapter: SdkAdapter
  static gameplayIsStarted = false
  static gameplayIsStopped = true
  static isGameReady = false

  static get flags() {
    return SdkManager.adapter.options.flags
  }

  // доступны ли покупки
  static get isPurchaseAvailable() {
    return SdkManager.adapter.purchase.isAvailable()
  }

  static get isUserAuth() {
    return SdkManager.adapter.player.isAuth()
  }

  static get isMobile() {
    return isMobile.any
  }

  // ------------- ↓ main ↓ -------------
  static initSdk = async (adapter: SdkAdapter) => {
    SdkManager.adapter = adapter

    await adapter.init()

    SdkManager.sdk = adapter
    SdkManager.makeReview = adapter.makeReview
    SdkManager.leaderboard = adapter.leaderboard
    SdkManager.purchase = adapter.purchase
    SdkManager.player = adapter.player

    SdkManager.checkAvailableFlags()
    SdkManager.showBanner()
    SdkManager.initSessionControl()

    if (SdkManager.isPlatform(PLATFORM_ID.cg)) {
      CrazyGames.init()
    }
  }

  // проверка, инициализированно-ли SDK
  static isReady = () => {
    const isReady = SdkManager.adapter.isReady

    if (!isReady) {
      console.error('[SdkManager]: SDK is not initialized')
      // попытка повторной инициализации
      SdkManager.initSdk(SdkManager.adapter)
    }
    return isReady
  }

  static gameplayStart = () => {
    if (Locator.game.stateName === GAME_STATES.gameState) return
    if (SdkManager.gameplayIsStarted) return

    SdkManager.gameplayIsStarted = true
    SdkManager.gameplayIsStopped = false
    SdkManager.sdk?.gameplayStart()
  }

  static gameplayStop = () => {
    if (Locator.game.stateName === GAME_STATES.gameState) return
    if (SdkManager.gameplayIsStopped) return

    SdkManager.gameplayIsStarted = false
    SdkManager.gameplayIsStopped = true
    SdkManager.sdk?.gameplayStop()
  }

  // сообщает SDK площадки, что игра загружена и готова к показу
  static gameReady = () => {
    if (SdkManager.isGameReady) return
    SdkManager.isGameReady = true
    SdkManager.adapter.gameReady()
  }

  static checkAvailableFlags = () => {
    const sdkFlags = SdkManager.adapter.options.flags

    // проверка на пустой объект
    if (sdkFlags && Object.keys(sdkFlags).length > 0) return

    SdkManager.adapter.options.flags = DEFAULT_FLAGS
  }

  // ------------- ↓ storage ↓ -------------
  static getPlayerId = () => {
    const id = SdkManager.sdk?.player?.getId()
    if (id) return id

    return null
  }

  static getLocalStorage = async () => {
    return await SdkManager.adapter.storage.getLocalStorage()
  }

  static getData = async () => {
    const keys = Object.keys(DEFAULT_DATA)
    return await SdkManager.adapter.storage.get(keys)
  }

  // ------------- ↓ advertising ↓ -------------
  static isRewardedAvailableNow = () => {
    return SdkManager.adapter.advertising.isRewardedAvailableNow()
  }

  static showInterstitial = ({onOpen, onClosed, onFinally, onError}: InterstitialCallbacks = {}) => {
    return new Promise<void>((resolve) => {
      if (Locator?.storage?.playerData?.hasAdPass) {
        resolve()
        return
      }

      if (onOpen) onOpen()

      SdkManager.adapter.advertising
        .showInterstitial()
        .then(() => {
          if (onClosed) onClosed()
        })
        .catch((err: unknown) => {
          // Base/no-adapters reject without a reason when interstitials are unsupported.
          if (err) console.error('[showInterstitial]', err)
          if (onError) onError(err)
        })
        .finally(() => {
          if (onFinally) onFinally()
          resolve()
        })
    })
  }

  static showRewarded = ({onOpen, onRewarded, onFinally, onError}: RewardedCallbacks = {}) => {
    if (onOpen) onOpen()

    SdkManager.adapter.advertising
      .showRewarded()
      .then(() => {
        if (onRewarded) onRewarded()
      })
      .catch((err: unknown) => {
        console.error('[showRewarded]', err)
        if (onError) onError(err)
      })
      .finally(() => {
        if (onFinally) onFinally()
      })
  }

  static showBanner = () => {
    SdkManager.adapter.advertising.showBanner().catch((error: unknown) => {
      // Base/no-adapters reject without a reason when banners are unsupported.
      if (error) console.error('[showBanner]', error)
    })
  }

  static initSessionControl = () => {
    SdkManager.adapter.session
      .open()
      .catch((error: unknown) => {
        console.error('session control error', error)
        SdkManager.adapter.session.showPopup()
      })
      .finally(() => {
        console.log('session control finished')
      })
  }

  // ------------- ↓ other ↓ -------------
  static getLang = async () => {
    return await SdkManager.adapter.getLang()
  }

  static getServerTime = async () => {
    return await SdkManager.adapter.getServerTime()
  }

  static getPlatformId = () => {
    const id = SdkManager.sdk?.getPlatformId()

    if (!id) {
      return ''
    }

    return id.toLowerCase()
  }

  static isPlatform = (platformName: string) => {
    return SdkManager.getPlatformId().includes(platformName)
  }
}

export type {SdkAdapter, SdkCatalogItem, SdkLeaderboard, SdkPlayer, SdkPurchase, SdkReview}
