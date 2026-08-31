import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import EntityManager from '../../core/EntityManager.ts'
import System from '../../core/System.ts'
import PositionComponent from '../movement/PositionComponent.ts'
import RotationComponent from '../rotation/RotationComponent.ts'
import SpriteComponent from './SpriteComponent.ts'

// Система создаёт и синхронизирует PixiJS-представления ECS-сущностей.

export default class RenderSystem extends System {
  #view: Container
  #spriteViews = new Map<string, Container>()

  constructor(entityManager: EntityManager, view: Container) {
    super(entityManager)
    this.#view = view
  }

  public init() {
    this.update(0)
  }

  public update(deltaMS: number) {
    void deltaMS

    this.#updateSprites()
  }

  public destroy() {
    this.#spriteViews.forEach((view) => view.destroy({children: true}))
    this.#spriteViews.clear()
  }

  // ------------------ sprites
  #updateSprites() {
    const entities = this.query(SpriteComponent, PositionComponent)

    entities.forEach((entity) => {
      const sprite = entity.getComponent(SpriteComponent)
      const position = entity.getComponent(PositionComponent)
      const rotation = entity.getComponent(RotationComponent)

      this.#syncSprite(entity.id, sprite, position, rotation)
    })

    this.#removeMissingSprites(new Set(entities.map((entity) => entity.id)))
  }

  // Синхронизирует ECS с PixiJS
  #syncSprite(entityId: string, component?: SpriteComponent, position?: PositionComponent, rotation?: RotationComponent) {
    if (!component || !position) return

    let spriteView = this.#spriteViews.get(entityId)
    if (!spriteView) {
      spriteView = this.#createSpriteView(entityId, component)
    }

    spriteView.position.set(position.x, position.y)

    const spriteVisual = spriteView.getChildByLabel(`${component.label}-visual`, true)
    if (rotation && spriteVisual) {
      spriteVisual.rotation = rotation.angle
    }
  }

  #createSpriteView(entityId: string, component: SpriteComponent) {
    const {anchorX, anchorY, label} = component
    const spriteView = new Container({label})
    const effectView = new Container({label: `${label}-effect`})
    const spriteVisual = GameUtils.createSprite(component.textureName, {
      label: `${label}-visual`,
      anchorX,
      anchorY,
    })

    effectView.addChild(spriteVisual)
    spriteView.addChild(effectView)

    this.#spriteViews.set(entityId, spriteView)
    this.#view.addChild(spriteView)

    return spriteView
  }

  // Удаляет представления исчезнувших entity
  #removeMissingSprites(activeEntityIds: Set<string>) {
    this.#spriteViews.forEach((view, entityId) => {
      if (activeEntityIds.has(entityId)) return

      view.destroy({children: true})
      this.#spriteViews.delete(entityId)
    })
  }
}
