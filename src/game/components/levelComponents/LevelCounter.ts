import {Container, Graphics, type Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

// Компонент отображает текущий счёт уровня.

const COUNTER_WIDTH = 160
const COUNTER_HEIGHT = 90
const COUNTER_PADDING = 15
const COUNTER_X = COUNTER_WIDTH / 2 + 40
const COUNTER_Y = COUNTER_HEIGHT / 2 + 30

export default class LevelCounter extends Container {
  updateAdaptive = true
  _customPosition = {x: COUNTER_X, y: COUNTER_Y}

  #scoreText!: Text

  constructor() {
    super({label: 'levelCounter'})

    this.#init()
  }

  public setScore(score: number) {
    this.#scoreText.text = score
  }

  #init() {
    const background = this.#createBackground()
    this.#scoreText = this.#createScoreText()
    this.addChild(background, this.#scoreText)
  }

  #createBackground() {
    return new Graphics({label: 'levelCounterBackground'})
      .roundRect(-COUNTER_WIDTH / 2, -COUNTER_HEIGHT / 2, COUNTER_WIDTH, COUNTER_HEIGHT, 12)
      .fill({color: 0xffffff, alpha: 0.35})
      .stroke({color: 0x17354d, width: 2, alpha: 0.35})
  }

  #createScoreText() {
    const text = GameUtils.createText(0, {
      name: 'levelCounterText',
      anchorX: 1,
      style: {
        ...primaryFontStyle,
        fontSize: 48,
        align: 'right',
      },
    })

    text.position.set(COUNTER_WIDTH / 2 - COUNTER_PADDING, 0)
    return text
  }
}
