import {DEFAULT_FLAGS, TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'

export default class ABTest {
  static instance: ABTest | undefined

  constructor() {
    if (typeof ABTest.instance === 'object') {
      return ABTest.instance
    }

    ABTest.instance = this
    return ABTest.instance
  }

  static getTimerRewardDuration = () => {
    if (!SdkManager.adapter.purchase.isAvailable()) {
      return TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE
    }

    return Number(SdkManager.adapter.options.flags.timerRewardDuration ?? DEFAULT_FLAGS.timerRewardDuration)
  }

  static get levelAdDelay() {
    return Number(SdkManager.adapter.options.flags.levelAdDelay ?? DEFAULT_FLAGS.levelAdDelay)
  }

  static get timerCompassDuration() {
    return Number(SdkManager.adapter.options.flags.timerCompassDuration ?? DEFAULT_FLAGS.timerCompassDuration)
  }

  static getFilteredLevels = () => {
    return Locator.gameConfig.levels
  }
}
