import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, type DestroyOptions, NineSliceSprite, Text, type TextStyleOptions, Texture} from 'pixi.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.ts'
import {LEVEL_TYPES, WORLD} from '@/game/config/constants.ts'
import LevelConfig from '@/game/config/LevelConfig.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import LevelRewardAnimator from '@/game/features/levelResultsReward/LevelRewardAnimator.ts'
import {primaryFontStyle, rewardWindowStyles} from '@/game/styles.ts'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.ts'

const REWARD = {
  hard: 4,
  veryHard: 6,
  extreme: 10,
}

/**
 * Если реклама недоступна, то кнопки не показываются и панелька закрывается самостоятельно
 * */

export default class LevelResultsReward extends Container {
  #game = Locator.game
  #header!: Container
  #rowBonus!: Container
  #rowReward!: Container
  #buttonsRow!: Container
  #buttonOk!: ButtonContainer
  #buttonReward!: ButtonContainer
  #rowTextStyle: TextStyleOptions = {
    ...primaryFontStyle,
    fill: rewardWindowStyles.rowTextColor,
    fontSize: 20,
  }
  #btnsTextStyle: TextStyleOptions = {
    ...primaryFontStyle,
    fontSize: 28,
  }
  #rewardAnimate!: LevelRewardAnimator
  #levelBonusValue = 10
  #resolve: () => void = () => undefined
  #isMultiple = false

  constructor() {
    super({label: 'levelResultsReward'})

    this.visible = false
    this.position.set(WORLD.HALF_W, WORLD.HALF_H)
  }

  get rowBonus() {
    return this.#rowBonus
  }

  get rowReward() {
    return this.#rowReward
  }

  get levelBonusValue() {
    return this.#levelBonusValue
  }

  get difficultyData() {
    const levelType = LevelConfig.levelType
    const difficulty = Object.values(LEVEL_TYPES).find(({name}) => name === levelType)?.difficulty

    if (difficulty) {
      return {levelType, textBonus: `${i18next.t(`difficultyLevels.${difficulty}`)}`, reward: REWARD[difficulty]}
    }

    return {levelType, textBonus: `${i18next.t('rewardWindow.bonus')}`, reward: 0}
  }

  init = async () => {
    const gameView = this.#game.view
    if (!gameView) {
      console.error('[LevelResultsReward]: view is missing')
      this.#updatePlayerCoins()
      return
    }

    this.#createBody()
    this.#createHeader()
    this.#createRowBonus()
    this.#createRowReward()
    this.#createButtons()
    this.#setEvents(true)
    this.scale.set(1.3)

    gameView.addChild(this)
    this.sortableChildren = true

    await this.#show()
    await this.#animateRewarding()
    await this.#showButtons()

    if (!SdkManager.isRewardedAvailableNow()) {
      await gsap.to({}, {delay: 0.1})
      this.#onHandlerOkClick()
    }

    return new Promise<void>((res) => {
      this.#resolve = res
    })
  }

  destroy(_options?: DestroyOptions) {
    const destroyOptions = typeof _options === 'object' ? {..._options, children: true} : {children: true}
    super.destroy(destroyOptions)
    this.#setEvents(false)
  }

  #updatePlayerCoins = () => {
    const {reward} = this.difficultyData
    let totalSum = this.#levelBonusValue + reward

    if (this.#isMultiple) totalSum *= 2

    Locator.storage.addCoins(totalSum)
  }

  #show = async () => {
    await gsap
      .timeline()
      .set(this, {visible: true})
      .from(this, {alpha: 0})
      .fromTo(this.#header.scale, {x: 0}, {x: 1, duration: 2, ease: 'back.out(1.5)'}, '<')
      .timeScale(4)
  }

  #hide = async (delay = 0) => {
    await gsap.timeline().to(this, {alpha: 0, duration: 0.3, delay: delay, visible: false})
    this.destroy()
    this.#updatePlayerCoins()
    this.#resolve()
  }

  #showButtons = async () => {
    if (!SdkManager.isRewardedAvailableNow()) return

    await gsap
      .timeline()
      .set(this.#buttonsRow, {visible: true})
      .from(this.#buttonsRow, {alpha: 0})
      .to(this.#buttonsRow, {y: 120, ease: 'linear'}, '<')
      .set(this.#buttonsRow, {zIndex: 1})
      .to(this.#buttonsRow, {y: 97, ease: 'back.out'})
  }

  #animateRewarding = async () => {
    this.#rewardAnimate = new LevelRewardAnimator(this)
    await this.#rewardAnimate.animate()
  }

  #setEvents = (bool: boolean): void => {
    const toggle = eventToggle(bool)

    this.#buttonOk[toggle.gameOnceOff]('pointerup', this.#onHandlerOkClick)
    this.#buttonReward[toggle.gameOnceOff]('pointerup', this.#onHandlerRewardClick)
  }

  #createBody = () => {
    const texture = Texture.from('frame-victory')
    const innerBody = new NineSliceSprite({
      texture,
      leftWidth: 50,
      topHeight: 50,
      rightWidth: 50,
      bottomHeight: 50,
    })

    innerBody.width = 330
    innerBody.height = 200
    innerBody.pivot.set(innerBody.width / 2, innerBody.height / 2)

    this.addChild(innerBody)
  }

  #createHeader = () => {
    const header = new Container({label: 'levelRewardHeader'})
    this.#header = header
    header.y = -105

    const sprite = GameUtils.createSprite('frame-victory-header')

    const text = new Text({
      text: i18next.t('rewardWindow.great'),
      style: {...primaryFontStyle, fontSize: 38, fill: rewardWindowStyles.headerTextColor},
    })
    text.y = rewardWindowStyles.headerTextOffsetY
    text.anchor.set(0.5)

    header.addChild(sprite, text)
    this.addChild(header)
  }

  #createRowBonus = () => {
    const row = new Container({label: 'levelRewardBonusRow'})
    this.#rowBonus = row
    row.y = -32

    const {textBonus} = this.difficultyData
    const textBonusName = GameUtils.createText(GameUtils.capitalize(textBonus), {
      style: this.#rowTextStyle,
      name: 'textBonusName',
      anchorX: 0,
    })
    textBonusName.x = -140

    const textBonusCoin = GameUtils.createText(0, {style: this.#rowTextStyle, name: 'textBonusCoin', anchorX: 1})
    textBonusCoin.x = +92

    const bonusCoin = this.#createCoin('bonusCoin')
    bonusCoin.x = +120

    row.addChild(textBonusName, textBonusCoin, bonusCoin)
    this.addChild(row)
  }

  #createRowReward = () => {
    const row = new Container({label: 'levelRewardTotalRow'})
    this.#rowReward = row
    row.y = 28

    const coins = Locator.storage.playerData.coins
    const textTotalCoins = GameUtils.createText(coins, {style: this.#rowTextStyle, name: 'textTotalCoins', anchorX: 0})
    textTotalCoins.x = -90

    const coinTotalCoins = this.#createCoin('coinTotalCoins')
    coinTotalCoins.x = -120

    const textSumReward = GameUtils.createText(`+${this.#levelBonusValue}`, {style: this.#rowTextStyle, name: 'textSumReward', anchorX: 1})
    textSumReward.x = +92

    const coinBonusSum = this.#createCoin('coinBonusSum')
    coinBonusSum.x = +120

    row.addChild(textTotalCoins, coinTotalCoins, textSumReward, coinBonusSum)
    this.addChild(row)
  }

  #createCoin = (name = 'coin') => {
    return GameUtils.createSprite('coin', {name, scale: 0.64})
  }

  #createButtons = () => {
    this.#buttonsRow = new Container({label: 'levelRewardButtons'})
    this.#buttonsRow.visible = false
    this.#buttonsRow.zIndex = -1

    this.#buttonOk = this.#createButtonOk()
    this.#buttonReward = this.#createButtonReward()

    this.#buttonsRow.addChild(this.#buttonOk, this.#buttonReward)
    this.addChild(this.#buttonsRow)
  }

  #createButtonOk = () => {
    const button = new ButtonContainer({props: {label: 'levelRewardOkButton'}})
    button.position.set(-80, 0)

    const sprite = GameUtils.createSprite('btn-secondary')
    sprite.scale.set(0.5)

    const text = GameUtils.createText('OK', {style: this.#btnsTextStyle})

    button.addChild(sprite, text)
    return button
  }

  #createButtonReward = () => {
    const button = new ButtonContainer({props: {label: 'levelRewardDoubleButton'}})
    button.position.set(80, 0)

    const sprite = GameUtils.createSprite('btn-primary')
    sprite.scale.set(0.5)

    const text = GameUtils.createText('x2', {style: this.#btnsTextStyle})

    const iconPlay = GameUtils.createSprite('icon-play')
    iconPlay.scale.set(0.7)
    iconPlay.position.set(-40, 0)

    const coin = this.#createCoin()
    coin.scale.set(0.5)
    coin.position.set(40, 0)

    button.addChild(sprite, text, iconPlay, coin)
    return button
  }

  #onHandlerOkClick = () => {
    this.#setEvents(false)
    this.#hide()
  }

  #onHandlerRewardClick = () => {
    this.#setEvents(false)
    gsap.to(this.#buttonsRow, {alpha: 0, visible: false})

    SdkManager.showRewarded({
      onRewarded: this.#onRewardedAction,
      onError: this.#onErrorAction,
    })
  }

  #onRewardedAction = async () => {
    this.#isMultiple = true
    await this.#rewardAnimate.multiplyReward()
    await this.#hide(0.5)
  }

  #onErrorAction = async () => {
    GameUtils.showError(null, {message: `${i18next.t('errors.ad')}`})

    await this.#hide()
  }
}
