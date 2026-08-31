import type {Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import StatBadge from './StatBadge.ts'

type GameWithRefs = typeof Locator.game & {
  refs: Record<string, StatBadge>
}

export default class StateBadgeController {
  #game = Locator.game as GameWithRefs
  #userLevel!: StatBadge
  #userCoins!: StatBadge

  constructor() {
    this.#init()
  }

  #init = () => {
    this.#createBadges()
    this.#setUserStats()
  }

  #createBadges = () => {
    this.#createUserLevel()
    // this.#createUserCoins()
  }

  #createUserLevel = () => {
    this.#userLevel = new StatBadge({
      label: 'userLevel',
      iconTexture: 'stat-badge-level-icon',
      basePosition: {x: 0, y: 60},
    })
    this.#game.refs.userLevel = this.#userLevel
    Locator.uiLayer.stateUiLayer.addChild(this.#userLevel)
  }

  #createUserCoins = () => {
    this.#userCoins = new StatBadge({
      label: 'userCoins',
      iconTexture: 'coin',
      basePosition: {x: 0, y: 150},
    })
    this.#game.refs.userCoins = this.#userCoins
    Locator.uiLayer.stateUiLayer.addChild(this.#userCoins)
  }

  #setUserStats = () => {
    if (this.#userLevel) {
      const userLevelText = this.#userLevel.getChildByLabel('badgeText') as Text
      userLevelText.text = Locator.storage.userLevel
    }

    if (this.#userCoins) {
      const userCoinsText = this.#userCoins.getChildByLabel('badgeText') as Text
      userCoinsText.text = Locator.storage.playerData.coins
    }
  }
}
