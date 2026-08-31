import i18next from 'i18next'
import type {Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import type Game from '@/game/Game.ts'
import PreloadView from '@/game/states/preload/PreloadView.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.ts'
import type LevelPreload from '../LevelPreload.ts'

let onceLoadIsLoaded = false

// загружается единожды при первом запуске
export default class InitialLoad {
  #game: Game
  #view!: PreloadView
  #preloadText!: Text

  constructor(levelEntity: LevelPreload) {
    this.#game = levelEntity.game
  }

  get view() {
    return this.#view
  }

  initView = () => {
    this.#view = new PreloadView()
    this.#game.gameContainer.addChild(this.#view)
    this.#preloadText = this.#view.refs.preloadText
  }

  execute = async () => {
    if (onceLoadIsLoaded) return

    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        await this.#onceLoadActions()
        break
      } catch (err) {
        attempts++
        await GameUtils.showTextPreloadAttempts(this.#preloadText, attempts, maxAttempts)
        console.error(err)
      }
    }
  }

  #onceLoadActions = async () => {
    this.#updateProgress(0)

    await Locator.gameConfig.loadLevelConfiguration()
    this.#updateProgress(10)

    await this.#createUiSpriteSheet()
    this.#updateProgress(100)

    onceLoadIsLoaded = true
  }

  #createUiSpriteSheet = async () => {
    await LoadUtils.loadSpriteSheet({spriteSheetName: 'levelUi'})
  }

  #updateProgress = (progress: number) => {
    this.#preloadText.text = i18next.t('textLoading.init') + ` \n${progress}%`
  }
}
