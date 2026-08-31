import {Container, type PointData, Text, type TextStyleOptions} from 'pixi.js'
import {primaryFontStyle} from '../../styles.ts'
import ButtonAnimator from '../../utils/animations/ButtonAnimator.ts'
import GameUtils from '../../utils/gameUtils/GameUtils.ts'

type ButtonContainerOptions = {
  props?: Record<string, any>
  spriteKeys?: SpriteData[]
  overHandler?: boolean
  initScale?: number
}

type CenterTextOptions = {
  text?: string | number
  style?: TextStyleOptions
  x?: number
  y?: number
  name?: string
}

type SpriteData =
  | string
  | ({
      key: string
      scale?: number | PointData
    } & Record<string, unknown>)

export default class ButtonContainer extends Container {
  declare type: string

  #spriteKeys: SpriteData[]
  #overHandler: boolean
  #initScale: number
  #defaultTextStyle = {
    ...primaryFontStyle,
    fill: 0x000000,
    fontSize: 40,
  }
  #innerText: Text | null = null

  constructor({props = {}, spriteKeys = [], overHandler = true, initScale = 1}: ButtonContainerOptions = {}) {
    super({label: props.label ?? props.name ?? 'button'})

    this.type = 'button'
    this.eventMode = 'static'
    this.cursor = 'pointer'

    const {label, name, ...containerProps} = props
    Object.assign(this, containerProps)
    if (label ?? name) this.label = label ?? name
    this.#spriteKeys = spriteKeys
    this.#overHandler = overHandler
    this.#initScale = initScale

    this.#init()
  }

  get innerText() {
    return this.#innerText
  }

  addCenterText = ({text = '', style = this.#defaultTextStyle, x = 0, y = 0, name = 'innerText'}: CenterTextOptions = {}) => {
    const innerText = new Text({text, style})
    innerText.label = name
    innerText.anchor.set(0.5)
    innerText.position.set(x, y)
    this.#innerText = innerText

    this.addChild(innerText)
  }

  #init = () => {
    this.#applyBaseSettings()
    this.#createSprites()
    this.#initOverHandler()
  }

  #applyBaseSettings = () => {
    this.scale.set(this.#initScale)
  }

  #createSprites = () => {
    this.#spriteKeys.forEach((spriteData) => {
      this.addChild(this.#createSprite(spriteData))
    })
  }

  #createSprite = (spriteData: SpriteData) => {
    if (typeof spriteData === 'string') {
      return GameUtils.createSprite(spriteData)
    }

    const {key, scale, ...spriteProps} = spriteData

    const sprite = GameUtils.createSprite(key)

    Object.assign(sprite, spriteProps)

    if (scale !== undefined) {
      if (typeof scale === 'number') sprite.scale.set(scale)
      else sprite.scale.set(scale.x, scale.y)
    }

    return sprite
  }

  #initOverHandler = () => {
    if (!this.#overHandler) return
    ButtonAnimator.initOverHandler(this)
  }
}
