import {Container} from 'pixi.js'
import GameUtils from '../../utils/gameUtils/GameUtils.ts'

export default class GameView extends Container {
  declare refs: Record<string, any>

  constructor() {
    super({label: 'gameView', sortableChildren: true})

    this.refs = {}

    this.#init()
  }

  #init = () => {
    this.#createBackground()
  }

  #createBackground() {
    const background = GameUtils.createSprite('startScreen')
    background.anchor.set(0)

    this.addChild(background)
  }
}
