import type {Container, FederatedPointerEvent, Rectangle} from 'pixi.js'
import MathTools from '@/game/utils/MathTools.ts'
import EntityManager from '../../core/EntityManager.ts'
import System from '../../core/System.ts'
import PositionComponent from '../movement/PositionComponent.ts'
import PointerControlComponent from './PointerControlComponent.ts'

/**
 * Плавно перемещает отмеченные сущности к указателю и удерживает их визуальные границы
 * внутри актуальной видимой области уровня.
 */

// что бы не было телепортации при касании двумя пальцами экрана
const POINTER_FOLLOW_SPEED = 5000

export default class PointerControlSystem extends System {
  readonly #view: Container
  readonly #movementArea: Rectangle

  constructor(entityManager: EntityManager, view: Container, movementArea: Rectangle) {
    super(entityManager)
    this.#view = view
    this.#movementArea = movementArea
  }

  public init() {
    this.#view.eventMode = 'static'
    this.#view.on('globalpointermove', this.#handlePointerMove, this)
    this.centerEntities()
  }

  public destroy() {
    this.#view.off('globalpointermove', this.#handlePointerMove, this)
  }

  public update(deltaMS: number) {
    const maxDistance = POINTER_FOLLOW_SPEED * (deltaMS / 1000)

    this.#getControlledEntities().forEach((entity) => {
      const pointerControl = entity.getComponent(PointerControlComponent)
      const position = entity.getComponent(PositionComponent)
      if (!pointerControl || !position || pointerControl.targetX === null) return

      position.x = this.#moveTowards(position.x, pointerControl.targetX, maxDistance)
    })
  }

  public centerEntities() {
    const centerX = this.#movementArea.x + this.#movementArea.width / 2

    this.#getControlledEntities().forEach((entity) => {
      const pointerControl = entity.getComponent(PointerControlComponent)
      const position = entity.getComponent(PositionComponent)
      if (!pointerControl || !position) return

      pointerControl.targetX = centerX
      position.x = centerX
    })
  }

  #handlePointerMove(event: FederatedPointerEvent) {
    const pointerPosition = this.#view.toLocal(event.global)

    this.#getControlledEntities().forEach((entity) => {
      const pointerControl = entity.getComponent(PointerControlComponent)
      if (!pointerControl) return

      pointerControl.targetX = this.#constrainX(pointerPosition.x, pointerControl.horizontalRadius)
    })
  }

  #getControlledEntities() {
    return this.query(PointerControlComponent, PositionComponent)
  }

  #constrainX(x: number, horizontalRadius: number) {
    const radius = Math.min(horizontalRadius, this.#movementArea.width / 2)
    const minX = this.#movementArea.left + radius
    const maxX = this.#movementArea.right - radius

    return MathTools.clamp(x, minX, maxX)
  }

  #moveTowards(currentX: number, targetX: number, maxDistance: number) {
    const distance = targetX - currentX
    if (Math.abs(distance) <= maxDistance) return targetX

    return currentX + Math.sign(distance) * maxDistance
  }
}
