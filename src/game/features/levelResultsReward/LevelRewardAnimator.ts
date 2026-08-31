import {gsap} from 'gsap'
import {type Container, type Sprite, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import type LevelResultsReward from '@/game/features/levelResultsReward/LevelResultsReward.ts'
import type {SpriteWithMetadata} from '@/game/utils/gameUtils/GameUtils.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import MathTools from '@/game/utils/MathTools.ts'

type RewardCoin = SpriteWithMetadata & {
  _randomPos?: {rx: number; ry: number}
}

type UpdateTextOptions = {
  increase?: boolean
  setIconPlus?: boolean
}

// ------ animate
// Цифры обновляются динамически
// 1 этап - поле бонус - монетки вылетают из 0 и там остается то число, которое начисляется
// 2 этап - бонусные монетки перелетают в счет награды уровня
// 3 этап - монетки из воздуха появляются и залетают в счёт игрока, увеличивая его
export default class LevelRewardAnimator {
  #view: LevelResultsReward
  #rowBonus: Container
  #textBonusCoin: Text | null
  #bonusCoin: Container | null
  #rowReward: Container

  #generatedCoins: RewardCoin[] = []
  #difficultyData: LevelResultsReward['difficultyData']
  #totalLevelSum = 0
  #flyDuration = 0.2
  #eachDelay = 0.1

  constructor(view: LevelResultsReward) {
    this.#view = view
    this.#rowBonus = view.rowBonus
    this.#rowReward = view.rowReward

    this.#textBonusCoin = this.#getRequiredText(this.#rowBonus, 'textBonusCoin')
    this.#bonusCoin = this.#getRequiredChild(this.#rowBonus, 'bonusCoin')

    this.#difficultyData = view.difficultyData
  }

  animate = async () => {
    const {reward} = this.#difficultyData
    this.#totalLevelSum = reward + this.#view.levelBonusValue

    if (!reward || reward === 0) {
      await this.#runNoBonusAction()
      return
    }

    await this.#runStep1()
    await this.#runStep2()
    await this.#runStep3()
  }

  multiplyReward = async () => {
    this.#totalLevelSum *= 2
    // 1) переместить монетки в шаг 2
    const coinBonusSum = this.#getRequiredChild(this.#rowReward, 'coinBonusSum')
    const textSumReward = this.#getRequiredText(this.#rowReward, 'textSumReward')
    const textTotalCoins = this.#getRequiredText(this.#rowReward, 'textTotalCoins')
    const coinTotalCoins = this.#getRequiredChild(this.#rowReward, 'coinTotalCoins')
    if (!coinBonusSum || !textSumReward || !textTotalCoins || !coinTotalCoins) return

    const startPos = GameUtils.getLocalPositionVarB(coinBonusSum, this.#view)
    const endPos = GameUtils.getLocalPositionVarB(coinTotalCoins, this.#view)

    await gsap
      .timeline()
      .set(this.#generatedCoins, {
        x: () => startPos.x + this.#getRandomPosition().rx,
        y: () => startPos.y + this.#getRandomPosition().ry,
        duration: this.#flyDuration,
        alpha: 0,
        visible: true,
      })
      .to(this.#generatedCoins, {
        x: startPos.x,
        y: startPos.y,
        alpha: 1,
        stagger: {
          each: this.#eachDelay,
          onComplete: () => {
            this.#updateTextValue(textSumReward, {setIconPlus: true})
            Locator.soundManager.play('sfx_coin')
          },
        },
      })
      .to(this.#generatedCoins, {
        x: endPos.x,
        y: endPos.y,
        duration: this.#flyDuration,
        stagger: {
          each: this.#eachDelay,
          onComplete: () => {
            this.#updateTextValue(textTotalCoins)
            Locator.soundManager.play('sfx_coin')
          },
        },
      })
  }

  #runNoBonusAction = async () => {
    const coinBonusSum = this.#getRequiredChild(this.#rowReward, 'coinBonusSum')
    if (!coinBonusSum) return

    const startPos = GameUtils.getLocalPositionVarB(coinBonusSum, this.#view)

    this.#totalLevelSum = this.#view.levelBonusValue
    this.#createCoins(this.#totalLevelSum, startPos.x, startPos.y)
    await this.#runStep3()
  }

  #runStep1 = async () => {
    if (!this.#bonusCoin) return

    await this.#createAndFly(this.#bonusCoin)
  }

  #runStep2 = async () => {
    const textSumReward = this.#getRequiredText(this.#rowReward, 'textSumReward')
    const coinBonusSum = this.#getRequiredChild(this.#rowReward, 'coinBonusSum')
    const textBonusCoin = this.#textBonusCoin
    if (!textSumReward || !coinBonusSum || !textBonusCoin) return

    if (this.#generatedCoins) {
      const {x, y} = GameUtils.getLocalPositionVarB(coinBonusSum, this.#view)

      await gsap
        .timeline()
        .to(this.#generatedCoins, {
          x: x,
          y: y,
          stagger: {
            each: this.#eachDelay,
            onComplete: () => {
              this.#updateTextValue(textBonusCoin, {increase: false})
              this.#updateTextValue(textSumReward, {setIconPlus: true})
              Locator.soundManager.play('sfx_coin')
            },
          },
        })
        .set(this.#generatedCoins, {visible: false})
    }
  }

  #runStep3 = async () => {
    const textTotalCoins = this.#getRequiredText(this.#rowReward, 'textTotalCoins')
    const coinTotalCoins = this.#getRequiredChild(this.#rowReward, 'coinTotalCoins')
    if (!textTotalCoins || !coinTotalCoins) return

    const {x, y} = GameUtils.getLocalPositionVarB(coinTotalCoins, this.#view)
    const coins = this.#generatedCoins

    if (coins.length < this.#totalLevelSum) {
      await this.#createAdditionalCoins(coins, x, y)
    }

    await gsap
      .timeline()
      .set(coins, {
        x: () => x + this.#getRandomPosition().rx,
        y: () => y + this.#getRandomPosition().ry,
        duration: this.#flyDuration,
        alpha: 0,
        visible: true,
      })
      .to(coins, {
        x: x,
        y,
        alpha: 1,
        stagger: {
          each: this.#eachDelay,
          onComplete: () => {
            this.#updateTextValue(textTotalCoins)
            Locator.soundManager.play('sfx_coin')
          },
        },
      })
      .set(coins, {visible: false})
  }

  #createAndFly = async (target: Container) => {
    const textBonusCoin = this.#textBonusCoin
    if (!textBonusCoin) return

    const {reward} = this.#difficultyData
    const {x, y} = GameUtils.getLocalPositionVarB(target, this.#view)
    const coins = this.#createCoins(reward, x, y)

    const flyProps = {
      x: (_index: number, coin: RewardCoin) => x + coin._randomPos!.rx,
      y: (_index: number, coin: RewardCoin) => y + coin._randomPos!.ry,
      duration: this.#flyDuration,
      ease: 'back.out',
      stagger: {
        each: this.#eachDelay,
        from: 'end',
        onComplete: () => {
          this.#updateTextValue(textBonusCoin)
          Locator.soundManager.play('sfx_coin')
        },
      },
    } as gsap.TweenVars

    await gsap.timeline().to(coins, {duration: this.#flyDuration, stagger: 0.1}).to(coins, flyProps, '<')
  }

  #updateTextValue = (textElement: Text, {increase = true, setIconPlus = false}: UpdateTextOptions = {}) => {
    let value = +textElement.text
    value += increase ? 1 : -1

    if (setIconPlus) {
      textElement.text = `+${value}`
      return
    }
    textElement.text = value
  }

  #createCoins = (maxCoins: number, x: number, y: number) => {
    this.#generatedCoins = []

    for (let i = 0; i < maxCoins; i++) {
      const coin = GameUtils.createSprite('coin', {name: 'rewardCoin', scale: 0.64}) as RewardCoin
      coin.position.set(x, y)

      const {rx, ry} = MathTools.getRandomPosition({
        maxX: 100,
        minY: 40,
        maxY: 150,
        forceYMinus: true,
      })
      coin._randomPos = {rx, ry}

      this.#view.addChild(coin)
      this.#generatedCoins.push(coin)
    }

    return this.#generatedCoins
  }

  // если на 3‑м этапе получили условные 10 монеток за бонус сложности, то нужно создать ещё 10 - число levelBonusValue
  // для того, что бы летели уже 20 монеток
  #createAdditionalCoins = (coins: RewardCoin[], x: number, y: number) => {
    const promises: Promise<Sprite>[] = []

    for (let i = coins.length; i < this.#totalLevelSum; i++) {
      promises.push(
        Promise.resolve().then(() => {
          const coin = GameUtils.createSprite('coin', {name: 'rewardCoin', scale: 0.64}) as RewardCoin
          coin.position.set(x, y)
          this.#view.addChild(coin)
          this.#generatedCoins.push(coin)
          return coin
        }),
      )
    }

    return Promise.all(promises)
  }

  #getRandomPosition = () => {
    const {rx, ry} = MathTools.getRandomPosition({
      minX: -150,
      maxX: 150,
      minY: -150,
      maxY: 150,
    })

    return {rx, ry}
  }

  #getRequiredChild = (parent: Container, label: string) => {
    const child = parent.getChildByLabel(label)
    if (!child) {
      console.error(`[LevelRewardAnimator]: reward element ${label} not found, animation step skipped`)
      return null
    }

    return child
  }

  #getRequiredText = (parent: Container, label: string) => {
    const child = this.#getRequiredChild(parent, label)
    if (!child) return null
    if (!(child instanceof Text)) {
      console.error(`[LevelRewardAnimator]: element ${label} is not text, animation step skipped`)
      return null
    }

    return child
  }
}
