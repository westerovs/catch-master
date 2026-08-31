import i18next from 'i18next'
import {Container, type Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

// Компонент отображает заголовок и оставшееся время уровня.

const TIMER_Y = 80
const TITLE_Y = -20
const VALUE_Y = 25
const WARNING_TIME_SECONDS = 10
const WARNING_TIME_COLOR = 0xff3b30

export default class LevelTimerView extends Container {
  updateAdaptive = true
  _customPosition = {y: TIMER_Y}

  #timeText!: Text

  constructor(initialSeconds: number) {
    super({label: 'levelTimerView'})

    this.#init(initialSeconds)
  }

  public setTime(seconds: number) {
    this.#timeText.text = seconds
    this.#timeText.style.fill = seconds <= WARNING_TIME_SECONDS ? WARNING_TIME_COLOR : primaryFontStyle.fill
  }

  #init(initialSeconds: number) {
    const title = this.#createTitle()
    this.#timeText = this.#createTimeText(initialSeconds)
    this.addChild(title, this.#timeText)
  }

  #createTitle() {
    const title = GameUtils.createText(i18next.t('level.time'), {
      name: 'levelTimerTitle',
      style: {
        ...primaryFontStyle,
        fontSize: 26,
      },
    })

    title.y = TITLE_Y
    return title
  }

  #createTimeText(initialSeconds: number) {
    const timeText = GameUtils.createText(initialSeconds, {
      name: 'levelTimerText',
      style: {
        ...primaryFontStyle,
        fontSize: 48,
      },
    })

    timeText.y = VALUE_Y
    return timeText
  }
}
