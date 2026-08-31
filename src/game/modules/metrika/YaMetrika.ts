import {GAME_NAMES} from '../../config/constants.ts'
import {GAME_NAME} from '../../generatedAssets/buildMeta.ts'

type LevelMetricConfig = {
  levelName: string
}

type LevelMetricStorage = {
  userLevel: number
}

const getId = () => {
  if (GAME_NAME === GAME_NAMES.detective) return 99603095
  if (GAME_NAME === GAME_NAMES.hotel) return 103542034
  if (GAME_NAME === GAME_NAMES.adventure) return 105982536
  if (GAME_NAME === GAME_NAMES.detectiveGirl) return 107254518
  else return 0
}

const COUNTER_ID = getId()

const ERROR_TYPES = {
  GAME_PRELOAD: {
    initialize: 'GAME_PRELOAD:initialize',
    loadPlayerData: 'GAME_PRELOAD:loadPlayerData',
    showAd: 'GAME_PRELOAD:showAd',
  },
  LEVEL_PRELOAD: {
    loading: 'LEVEL_PRELOAD:loading',
    loadBundle: 'LEVEL_PRELOAD:loadBundle',
  },
  SOUND_PRELOAD: {
    preload: 'SOUND_PRELOAD:preload',
  },
}

// не работает на localhost, переключить в режим DEV
export default class YaMetrika {
  // ================ ↓ ЦЕЛИ ↓ ===============
  // =========================================
  static btnStart = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'clickBtnStart')
  }

  static mainScreenBtnStore = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'mainScreenBtnStore')
  }

  static btnLeaders = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'clickBtnLeaders')
  }

  // --------------- ОТЗЫВЫ
  // Нажатие на кнопку оставить отзыв за звезды
  static userReviewClickOk = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'userReviewClickOk')
  }

  // Нажатие на кнопку позже в предложении поставить отзыв
  static userReviewClickLater = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'userReviewClickLater')
  }

  // --------------- Экран завершения  уровня
  static finalScreenBtnNext = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'finalScreenBtnNext')
  }

  static finalScreenBtnHome = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'finalScreenBtnHome')
  }

  // Кнопка отключить рекламу
  static finalScreenBtnDisableAd = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'finalScreenBtnDisableAd')
  }

  // Клик по кнопке Магазин (финальный экран)
  static finalScreenBtnStore = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'finalScreenBtnStore')
  }

  // Все уровни пройдены полностью
  static completeGame = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'completeGame')
  }

  // Время сессии после загрузки, таймер каждые 3 минуты
  static gameTimeTracker = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'gameTimeTracker')
  }

  // --------------- Реклама
  static rewardedAdWatched = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'rewardedAdWatched')
  }

  static interstitialWatched = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'interstitialWatched')
  }

  static forceReload = () => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'reachGoal', 'forceReload')
  }

  // ============= ↓ Параметры ↓ =============
  // =========================================
  static startLevel = (config: LevelMetricConfig, storage: LevelMetricStorage) => {
    if (typeof ym !== 'function') return
    const {levelName} = config
    const {userLevel} = storage

    ym(COUNTER_ID, 'params', {
      startLevel: {
        levelName,
        userLevel,
      },
    })
  }

  // статистика прохождения уровня, включая его время играния
  static completeLevel = (config: LevelMetricConfig, storage: LevelMetricStorage, levelPlayTime: number) => {
    if (typeof ym !== 'function') return

    const {levelName} = config
    const {userLevel} = storage

    const data = {
      levelName: `levelName: ${levelName} / levelPlayTime: ${levelPlayTime}`,
      userLevel: {
        [userLevel]: {levelPlayTime},
      },
    }

    ym(COUNTER_ID, 'params', {
      completeLevel: data,
    })
  }

  // когда досрочно вышли с уровня
  static earlyExit = (config: LevelMetricConfig, storage: LevelMetricStorage, levelPlayTime: number) => {
    if (typeof ym !== 'function') return

    const {levelName} = config
    const {userLevel} = storage

    const data = {
      levelName: `levelName: ${levelName} / levelPlayTime: ${levelPlayTime}`,
      userLevel: {
        [userLevel]: {levelPlayTime},
      },
    }

    ym(COUNTER_ID, 'params', {
      earlyExit: data,
    })
  }

  static purchase = (id: string) => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'params', {purchase: {id}})
  }

  static soundLoadErr = (src: unknown, err: unknown) => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'params', {soundLoadErr: {src, err}})
  }

  static preloadError = (type: string, error: unknown) => {
    if (typeof ym !== 'function') return
    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack || 'No stack available' : 'No stack available'

      const errorPayload = {
        [`error_${type}`]: {
          error: {
            message: errorMessage,
            stack: errorStack,
          },
        },
      }

      ym(COUNTER_ID, 'params', errorPayload)
    } catch (e) {
      console.warn('metrika preloadError', e)
    }
  }

  // -------------- OTHER
  static testingErrors = () => {
    const e = new Error('Это тестовая ошибка')

    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.initialize, e)
    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.loadPlayerData, e)
    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.showAd, e)

    YaMetrika.preloadError(ERROR_TYPES?.LEVEL_PRELOAD?.loading, e)
    YaMetrika.preloadError(ERROR_TYPES?.LEVEL_PRELOAD?.loadBundle, e)
    YaMetrika.preloadError(ERROR_TYPES?.SOUND_PRELOAD?.preload, e)
  }

  static loadDuration = (duration: number) => {
    if (typeof ym !== 'function') return
    ym(COUNTER_ID, 'params', {gameLoadTime: duration})
  }
}

export {ERROR_TYPES}
