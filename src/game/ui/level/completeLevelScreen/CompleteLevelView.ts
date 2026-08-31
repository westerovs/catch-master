import i18next from 'i18next'
import {Container, type Text} from 'pixi.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.ts'
import {applyInteractive} from '@/game/components/buttons/buttons.ts'
import {GAME_NAMES, WORLD} from '@/game/config/constants.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

// Вьюха отображает итоговый результат и кнопки завершённого уровня.

const STYLES = {
  btnNext: {
    ...primaryFontStyle,
    fontSize: 36,
  },
  arrow: {
    ...primaryFontStyle,
    fontSize: 22,
    fill: 0xffffff,
  },
  resultTitle: {
    ...primaryFontStyle,
    fontSize: 42,
    fill: 0xffffff,
    stroke: {color: 0x000000, width: 4},
  },
  resultScore: {
    ...primaryFontStyle,
    fontSize: 90,
    fill: 0xffffff,
    stroke: {color: 0x000000, width: 4},
  },
  record: {
    ...primaryFontStyle,
    fontSize: 56,
    fill: 0x5b3a1c,
    stroke: {color: 0xffef9f, width: 4},
  },
  newRecord: {
    ...primaryFontStyle,
    fontSize: 34,
    fill: 0xffd84d,
    stroke: {color: 0x6b2d09, width: 6},
    dropShadow: {
      color: 0x000000,
      alpha: 0.35,
      blur: 3,
      distance: 4,
      angle: Math.PI / 2,
    },
  },
}

type LevelResult = {
  score: number
  maxScore: number
  isNewRecord: boolean
}

export default class CompleteLevelView extends Container {
  #refs: Record<string, any>
  #scoreText!: Text
  #recordText!: Text
  #newRecordText!: Text

  constructor({refs = {}}: {refs?: Record<string, any>} = {}) {
    super({label: 'completeLevelView'})

    this.#refs = refs
    this.zIndex = 1

    this.#init()
  }

  public setResult({score, maxScore, isNewRecord}: LevelResult) {
    this.#scoreText.text = score
    this.#recordText.text = i18next.t('level.record', {score: maxScore})
    this.#recordText.visible = !isNewRecord
    this.#newRecordText.visible = isNewRecord
  }

  #init = () => {
    this.#refs.completeLevelView = this
    this.#createResult()
    this.#createButtonsContainer()
  }

  #createResult() {
    const result = new Container({label: 'levelResult'})
    const title = GameUtils.createText(i18next.t('level.result'), {
      name: 'levelResultTitle',
      style: STYLES.resultTitle,
    })
    this.#scoreText = GameUtils.createText(0, {
      name: 'levelResultScore',
      style: STYLES.resultScore,
    })
    this.#recordText = GameUtils.createText('', {
      name: 'levelRecord',
      style: STYLES.record,
    })
    this.#newRecordText = GameUtils.createText(i18next.t('level.newRecord'), {
      name: 'levelNewRecord',
      style: STYLES.newRecord,
    })

    result.position.set(WORLD.HALF_W, 420)
    title.y = -85
    this.#scoreText.y = 5
    this.#recordText.y = 95
    this.#newRecordText.y = 95
    this.#newRecordText.visible = false
    result.addChild(title, this.#scoreText, this.#recordText, this.#newRecordText)
    this.addChild(result)
  }

  #createButtonsContainer() {
    const buttonsContainer = new Container({label: 'btnsContainer'})
    buttonsContainer.position.set(WORLD.HALF_W, 800)

    buttonsContainer.addChild(this.#createButtonNext())
    buttonsContainer.addChild(this.#createButtonReplay())

    if (SdkManager.flags?.noStore) {
      buttonsContainer.addChild(this.#createButtonHome())
    } else {
      buttonsContainer.addChild(this.#createButtonStore(), this.#createButtonHome(), this.#createButtonByeAd())
    }

    this.addChild(buttonsContainer)
  }

  #createButtonNext() {
    const button = new Container({label: 'btnNext'})
    applyInteractive(button, {isButton: true})

    const textureKey = GAME_NAME === GAME_NAMES.hotel ? 'btn-start' : 'btn-next'
    const background = GameUtils.createSprite(textureKey)
    const text = GameUtils.createText(`${i18next.t('btnNextText')}`, {
      style: STYLES.btnNext,
    })
    const arrow = this.#createButtonNextArrow()

    button.addChild(background, text, arrow)
    return button
  }

  #createButtonNextArrow() {
    const arrow = new Container({label: 'btnNextArrow'})
    arrow.position.set(-54, -75)

    const background = GameUtils.createSprite('btn-next-arrow')
    const text = GameUtils.createText('', {
      name: 'arrowText',
      style: STYLES.arrow,
    })

    arrow.addChild(background, text)
    return arrow
  }

  #createButtonStore() {
    return new ButtonContainer({
      props: {
        name: 'btnBuyLoupe',
        x: -155,
        y: 195,
      },
      spriteKeys: ['btn-ui-2', {key: 'icon-loupe-plus', scale: 0.6}],
      overHandler: false,
    })
  }

  #createButtonReplay() {
    return new ButtonContainer({
      props: {
        name: 'btnReplay',
        x: -70,
        y: 160,
      },
      spriteKeys: ['btn-ui-1', {key: 'icon-restart', scale: 0.4}],
      overHandler: false,
    })
  }

  #createButtonHome() {
    return new ButtonContainer({
      props: {
        name: 'btnHome',
        x: 70,
        y: 160,
      },
      spriteKeys: ['btn-ui-1', 'icon-home'],
      overHandler: false,
    })
  }

  #createButtonByeAd() {
    const button = new ButtonContainer({
      props: {
        name: 'btnByeAd',
        x: 155,
        y: 199,
      },
      spriteKeys: ['btn-ui-2', 'icon-noAd'],
      overHandler: false,
    })

    const text = GameUtils.createText('100\nголосов', {
      name: 'btnByeAdText',
      anchorX: 1,
      anchorY: 0,
      style: {
        ...primaryFontStyle,
        fontSize: 22,
        lineHeight: 21,
        fill: 0xffffff,
        stroke: {color: '#000000', width: 2},
        align: 'right',
      },
    })
    text.position.set(50, 10)

    button.addChild(text)
    return button
  }
}
