import i18next from 'i18next'
import {Container} from 'pixi.js'
import {type LevelDifficulty, type LevelTypeData} from '@/game/config/constants.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

const COLORS = {
  white: 0xffffff,
  red: 0xff2b3e,
  black: 0x2f2f2f,
  orange: 0xffa500,
}

const BADGE_TINT: Record<LevelDifficulty, number> = {
  hard: COLORS.orange,
  veryHard: COLORS.red,
  extreme: COLORS.black,
}

type BtnBadgeOptions = {
  type: LevelTypeData
}

export default class BtnBadge extends Container {
  #type: LevelTypeData

  constructor({type}: BtnBadgeOptions) {
    super({label: 'btnBadge'})

    this.#type = type

    this.#init()
  }

  #init = () => {
    this.position.set(90, 46)
    this.angle = -10
    this.visible = false

    this.#createContent()
  }

  #createContent() {
    const {badgeTint, message, textFill} = this.#getBadgeData()

    const background = GameUtils.createSprite('btn-badge')
    background.tint = badgeTint

    const text = GameUtils.createText(message, {
      name: 'arrowText',
      style: {
        ...primaryFontStyle,
        fontSize: 23,
        fill: textFill,
      },
    })
    text.x = 10
    text.angle = -1

    this.addChild(background, text)
  }

  #getBadgeData() {
    const {difficulty} = this.#type

    return {
      badgeTint: difficulty ? BADGE_TINT[difficulty] : COLORS.white,
      message: difficulty ? `${i18next.t(`difficultyLevels.${difficulty}`)}` : '',
      textFill: COLORS.white,
    }
  }
}
