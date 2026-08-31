import i18next from 'i18next'
import {Container} from 'pixi.js'
import {WORLD} from '../../config/constants.ts'
import GameUtils from '../../utils/gameUtils/GameUtils.ts'

export default class PreloadView extends Container {
  declare refs: Record<string, any>

  constructor() {
    super({label: 'preloadView', sortableChildren: true})

    this.refs = {}

    this.#init()
  }

  #init = () => {
    this.#createPreloadText()
  }

  #createPreloadText() {
    const preloadText = GameUtils.createText(`${i18next.t('textLoading')}...`, {
      name: 'preloadText',
      style: {
        fontSize: 40,
        fill: 0xffffff,
        fontFamily: 'primaryFont',
        align: 'center',
      },
    })
    preloadText.position.set(WORLD.HALF_W, WORLD.HALF_H)

    this.refs.preloadText = preloadText
    this.addChild(preloadText)
  }
}
