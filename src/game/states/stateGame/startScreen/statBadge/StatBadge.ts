import type {TextStyleOptions} from 'pixi.js'
import {Container, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '../../../../utils/gameUtils/GameUtils.ts'

type StatBadgeOptions = {
  label: string
  iconTexture: string
  basePosition?: {x: number; y: number}
}

const LEFT_PADDING = 40

export default class StatBadge extends Container {
  #iconTexture: string
  #basePosition: {x: number; y: number}
  #text!: Text

  constructor({label, iconTexture, basePosition = {x: 0, y: 0}}: StatBadgeOptions) {
    super({label})

    this.#iconTexture = iconTexture
    this.#basePosition = basePosition

    this.#init()
  }

  setText = (value: string | number) => {
    this.#text.text = value
  }

  #init = () => {
    this.#create()
    this.#alignLeft()
  }

  #create = () => {
    const cover = GameUtils.createSprite('stat-badge')
    const icon = GameUtils.createSprite(this.#iconTexture)
    icon.x = -60

    this.#text = new Text({text: '...', style: {...primaryFontStyle} as TextStyleOptions})
    this.#text.label = 'badgeText'
    this.#text.anchor.set(0.5)
    this.#text.position.set(12, 0)

    this.addChild(cover, icon, this.#text)
  }

  #alignLeft = () => {
    const bounds = this.getLocalBounds()
    this.position.set(LEFT_PADDING - bounds.x + this.#basePosition.x, this.#basePosition.y)
  }
}
