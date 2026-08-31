import {Cache, type Container, Rectangle, Texture, type Ticker} from 'pixi.js'
import {WORLD} from '@/game/config/constants.ts'
import type {LevelDifficultyConfig} from '@/game/config/levelDifficulty.ts'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import {SFX_ALIASES} from '@/game/generatedAssets/soundList.ts'
import {getRandomItem} from '@/game/utils/commonUtils.ts'
import BasketCatchAnimator from './basket/BasketCatchAnimator.ts'
import BasketComponent from './basket/BasketComponent.ts'
import EntityManager from './core/EntityManager.ts'
import SystemManager from './core/SystemManager.ts'
import DespawnSystem from './drop/DespawnSystem.ts'
import DropCatchSystem, {type DropCaughtData} from './drop/DropCatchSystem.ts'
import DropFeedbackAnimator from './drop/DropFeedbackAnimator.ts'
import DropSpawnerComponent from './drop/DropSpawnerComponent.ts'
import DropSpawnSystem from './drop/DropSpawnSystem.ts'
import DropBoundsSystem from './features/dropBounds/DropBoundsSystem.ts'
import ZigzagSystem from './features/zigzag/ZigzagSystem.ts'
import {BASKET_COLLISION_HEIGHT, BASKET_COLLISION_WIDTH, createWeightedDropCatalog} from './gameplayConfig.ts'
import MovementSystem from './mechanics/movement/MovementSystem.ts'
import PositionComponent from './mechanics/movement/PositionComponent.ts'
import PointerControlComponent from './mechanics/pointerControl/PointerControlComponent.ts'
import PointerControlSystem from './mechanics/pointerControl/PointerControlSystem.ts'
import RenderSystem from './mechanics/rendering/RenderSystem.ts'
import SpriteComponent from './mechanics/rendering/SpriteComponent.ts'
import RotationSystem from './mechanics/rotation/RotationSystem.ts'

// Класс создаёт сущности и системы уровня и управляет их жизненным циклом.

type LevelRuntimeOptions = {
  view: Container
  difficultyConfig: LevelDifficultyConfig
}

// Звуки items
const HARMFUL_CATCH_SFX_NAME = 'poison'
const DROP_LANDING_SFX_NAME = 'shmiak'
const MATCH_SFX_NAMES = SFX_ALIASES.filter((soundName) => soundName.startsWith('sfx_match'))
const DROP_SIDE_PADDING = 40
const BASKET_TEXTURE_NAME = 'bucket'

export default class LevelRuntime {
  #game = Locator.game
  #view: Container
  #entityManager: EntityManager
  #systemManager: SystemManager
  #pointerControlSystem: PointerControlSystem
  #basketCatchAnimator: BasketCatchAnimator
  #dropFeedbackAnimator: DropFeedbackAnimator
  #difficultyConfig: LevelDifficultyConfig
  readonly #basketArea = new Rectangle()
  readonly #dropArea = new Rectangle()
  #isInitialized = false

  constructor({view, difficultyConfig}: LevelRuntimeOptions) {
    this.#view = view
    this.#difficultyConfig = difficultyConfig
    this.#entityManager = new EntityManager()
    this.#systemManager = new SystemManager()
    this.#pointerControlSystem = new PointerControlSystem(this.#entityManager, view, this.#basketArea)
    this.#basketCatchAnimator = new BasketCatchAnimator(view)
    this.#dropFeedbackAnimator = new DropFeedbackAnimator(view)
  }

  init() {
    if (this.#isInitialized) return

    this.#updatePlayAreas()
    this.#createEntities()
    this.#createSystems()

    this.#game.on(GAME_EVENTS.gameResize, this.#handleResize, this)
    this.#game.app.ticker.add(this.#update, this)
    this.#isInitialized = true
  }

  destroy() {
    if (!this.#isInitialized) return

    this.#game.off(GAME_EVENTS.gameResize, this.#handleResize, this)
    this.#game.app.ticker.remove(this.#update, this)
    this.#basketCatchAnimator.destroy()
    this.#dropFeedbackAnimator.destroy()
    this.#systemManager.removeAllSystems()
    this.#entityManager.clear()
    this.#isInitialized = false
  }

  #createEntities() {
    this.#createBasketEntity()
    this.#createDropSpawnerEntity()
  }

  #createBasketEntity() {
    const basketEntity = this.#entityManager.createEntity('basket')
    const centerX = this.#basketArea.x + this.#basketArea.width / 2

    basketEntity.addComponent(new PositionComponent(centerX, WORLD.HEIGHT - 40))
    basketEntity.addComponent(new SpriteComponent(BASKET_TEXTURE_NAME, 'basket', 0.5, 1))
    basketEntity.addComponent(new PointerControlComponent(this.#getBasketHorizontalRadius()))
    basketEntity.addComponent(new BasketComponent(BASKET_COLLISION_WIDTH, BASKET_COLLISION_HEIGHT))
  }

  #createDropSpawnerEntity() {
    const spawnerEntity = this.#entityManager.createEntity('drop-spawner')
    spawnerEntity.addComponent(new DropSpawnerComponent(this.#difficultyConfig.spawnIntervalMS))
  }

  #createSystems() {
    const dropCatalog = createWeightedDropCatalog(this.#difficultyConfig.harmfulItemWeight)

    this.#systemManager.addSystem('pointer-control', this.#pointerControlSystem)
    this.#systemManager.addSystem(
      'drop-spawn',
      new DropSpawnSystem(this.#entityManager, this.#dropArea, {
        dropCatalog,
        fallSpeedMultiplier: this.#difficultyConfig.fallSpeedMultiplier,
      }),
    )
    this.#systemManager.addSystem('movement', new MovementSystem(this.#entityManager))
    this.#systemManager.addSystem('zigzag', new ZigzagSystem(this.#entityManager, this.#dropArea))
    this.#systemManager.addSystem('drop-bounds', new DropBoundsSystem(this.#entityManager, this.#dropArea))
    this.#systemManager.addSystem('drop-catch', new DropCatchSystem(this.#entityManager, this.#handleDropCaught.bind(this)))
    this.#systemManager.addSystem('despawn', new DespawnSystem(this.#entityManager, this.#handleDropLanded.bind(this)))
    this.#systemManager.addSystem('rotation', new RotationSystem(this.#entityManager))
    this.#systemManager.addSystem('render', new RenderSystem(this.#entityManager, this.#view))

    this.#systemManager.initSystems()
  }

  #handleDropCaught(data: DropCaughtData) {
    const isHarmful = data.points < 0

    this.#basketCatchAnimator.play(isHarmful)
    this.#dropFeedbackAnimator.playScore(data)
    this.#playCatchSound(isHarmful)
    this.#game.emit(GAME_EVENTS.LEVEL.dropCaught, data.points)
  }

  #handleDropLanded(entityId: string) {
    const randomRate = 0.6 + Math.random() * 0.6

    void Locator.soundManager.play(DROP_LANDING_SFX_NAME, {rate: randomRate})
    this.#dropFeedbackAnimator.playLanding(entityId, () => this.#entityManager.removeEntity(entityId))
  }

  #playCatchSound(isHarmful: boolean) {
    if (isHarmful) {
      void Locator.soundManager.play(HARMFUL_CATCH_SFX_NAME)
      return
    }

    const matchSoundName = getRandomItem(MATCH_SFX_NAMES)
    if (!matchSoundName) {
      console.error('[LevelRuntime]: match sound is missing')
      return
    }

    void Locator.soundManager.play(matchSoundName)
  }

  #handleResize() {
    this.#updatePlayAreas()
    this.#pointerControlSystem.centerEntities()
  }

  /**
   * Переводит видимые границы UiLayer в координаты уровня и обновляет общие Rectangle.
   * Системы хранят ссылки на эти области, поэтому после ресайза используют актуальные границы.
   */
  #updatePlayAreas() {
    this.#updateHorizontalArea(this.#basketArea, 0)
    this.#updateHorizontalArea(this.#dropArea, DROP_SIDE_PADDING)
  }

  #updateHorizontalArea(area: Rectangle, padding: number) {
    const uiLayer = Locator.uiLayer
    const left = this.#view.toLocal({x: padding, y: 0}, uiLayer).x
    const right = this.#view.toLocal({x: uiLayer.uiData.width - padding, y: 0}, uiLayer).x
    const center = this.#view.toLocal({x: uiLayer.uiData.center.x, y: 0}, uiLayer).x
    const width = Math.max(0, right - left)

    area.set(width > 0 ? left : center, 0, width, WORLD.HEIGHT)
  }

  #getBasketHorizontalRadius() {
    const cachedAsset = Cache.get(BASKET_TEXTURE_NAME)
    const texture = cachedAsset instanceof Texture ? cachedAsset : cachedAsset?.texture

    if (!(texture instanceof Texture)) {
      console.error(`[LevelRuntime]: texture '${BASKET_TEXTURE_NAME}' is missing`)
      return BASKET_COLLISION_WIDTH / 2
    }

    return texture.width / 2
  }

  #update(ticker: Ticker) {
    this.#systemManager.update(ticker.deltaMS)
  }
}
