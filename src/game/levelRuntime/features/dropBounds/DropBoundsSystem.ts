import type {Rectangle} from 'pixi.js'
import MathTools from '@/game/utils/MathTools.ts'
import EntityManager from '../../core/EntityManager.ts'
import System from '../../core/System.ts'
import DropComponent from '../../drop/DropComponent.ts'
import PositionComponent from '../../mechanics/movement/PositionComponent.ts'

/**
 * Удерживает активные items внутри видимой горизонтальной области уровня.
 * После ресайза использует обновлённый Rectangle и сдвигает вышедшие за границы items
 * к ближайшему краю с учётом визуального радиуса вращающегося изображения.
 */

export default class DropBoundsSystem extends System {
  readonly #dropArea: Rectangle

  constructor(entityManager: EntityManager, dropArea: Rectangle) {
    super(entityManager)
    this.#dropArea = dropArea
  }

  public update(deltaMS: number) {
    void deltaMS

    this.query(DropComponent, PositionComponent).forEach((entity) => {
      const drop = entity.getComponent(DropComponent)
      const position = entity.getComponent(PositionComponent)
      if (!drop || !position) return

      this.#constrainPosition(drop, position)
    })
  }

  #constrainPosition(drop: DropComponent, position: PositionComponent) {
    const visualRadius = Math.min(drop.visualRadius, this.#dropArea.width / 2)
    const minX = this.#dropArea.left + visualRadius
    const maxX = this.#dropArea.right - visualRadius

    position.x = MathTools.clamp(position.x, minX, maxX)
  }
}
