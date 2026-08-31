import i18next from 'i18next'
import {Container, type TextStyleOptions} from 'pixi.js'
import ButtonContainer from '../../../components/buttons/ButtonContainer'
import Locator from '../../../engine/Locator.ts'
import {FONT_COLORS, primaryFontStyle} from '../../../styles.ts'

export default class GameMenuView extends Container {
  #offsetY = 10
  #textStyle: TextStyleOptions = {
    ...primaryFontStyle,
    fontSize: 36,
    align: 'center',
    fill: FONT_COLORS.secondFont,
  }
  _customPosition = {
    y: 750,
  }

  constructor() {
    super()

    this.label = 'GameMenuView'
    this.#init()
  }

  public updateAdaptive = () => {
    const {x} = Locator.uiLayer.uiData.center

    this.position.set(x, this._customPosition.y)
  }

  #init = () => {
    this.#createBtnStart()
    // this.#createBtnLeaders(1)
    // this.#createBtnStore(2)

    Locator.uiLayer.stateUiLayer.addChild(this)
    this.updateAdaptive()
  }

  #createBtnStart = () => {
    const button = new ButtonContainer({
      props: {name: 'btnStart', x: 0, y: 0},
      spriteKeys: ['btn-primary'],
    })
    button.addCenterText({
      text: `${i18next.t('btnStart')}`,
      style: {...this.#textStyle, fontSize: 46},
    })

    this.addChild(button)
  }

  #createBtnStore = (offsetOrder: number) => {
    const button = new ButtonContainer({
      props: {name: 'btnStore', x: 0, y: 0},
      spriteKeys: ['btn-secondary'],
    })
    button.addCenterText({
      text: `${i18next.t('btnStore')}`,
      style: this.#textStyle,
    })
    button.y = (button.height + this.#offsetY) * offsetOrder

    this.addChild(button)
  }

  #createBtnLeaders = (offsetOrder: number) => {
    const button = new ButtonContainer({
      props: {name: 'btnLeaders', x: 0, y: 0},
      spriteKeys: ['btn-secondary'],
    })
    button.addCenterText({
      text: `${i18next.t('btnLeaders')}`,
      style: this.#textStyle,
    })
    button.y = (button.height + this.#offsetY) * offsetOrder

    this.addChild(button)
  }
}
