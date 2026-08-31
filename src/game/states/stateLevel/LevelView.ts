import {Container} from 'pixi.js'
import CompleteLevelView from '@/game/ui/level/completeLevelScreen/CompleteLevelView.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

export default class LevelView extends Container {
  declare refs: Record<string, any>

  constructor() {
    super({label: 'levelView', sortableChildren: true})

    this.refs = {}

    this.#init()
  }

  #init = () => {
    this.#createCompleteLevelView()
  }

  public createBackground(backgroundName: string) {
    const background = GameUtils.createSprite(backgroundName, {
      label: 'background',
      anchorX: 0,
      anchorY: 0,
    })

    this.addChildAt(background, 0)
  }

  #createCompleteLevelView() {
    const completeLevelView = new CompleteLevelView({
      refs: this.refs,
    })
    completeLevelView.visible = false

    this.refs.completeLevelView = completeLevelView
    this.addChild(completeLevelView)
  }
}
