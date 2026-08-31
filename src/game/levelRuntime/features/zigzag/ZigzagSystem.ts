import type {Rectangle} from 'pixi.js'
import MathTools from '@/game/utils/MathTools.ts'
import EntityManager from '../../core/EntityManager.ts'
import System from '../../core/System.ts'
import DropComponent from '../../drop/DropComponent.ts'
import PositionComponent from '../../mechanics/movement/PositionComponent.ts'
import ZigzagComponent from './ZigzagComponent.ts'

// Система перемещает активные items зигзагом относительно вертикального пути.

const getZigzagAmplitude = (amplitudeX: number, visualRadius: number, areaWidth: number) => {
  const availableAmplitude = Math.max(0, areaWidth / 2 - visualRadius)
  return Math.min(amplitudeX, availableAmplitude)
}

export default class ZigzagSystem extends System {
  readonly #dropArea: Rectangle

  constructor(entityManager: EntityManager, dropArea: Rectangle) {
    super(entityManager)
    this.#dropArea = dropArea
  }

  public update(deltaMS: number) {
    void deltaMS

    const entities = this.query(DropComponent, PositionComponent, ZigzagComponent)

    entities.forEach((entity) => {
      const drop = entity.getComponent(DropComponent)
      const position = entity.getComponent(PositionComponent)
      const zigzag = entity.getComponent(ZigzagComponent)
      if (!drop || !position || !zigzag) return

      this.#updateHorizontalPosition(drop, position, zigzag)
    })
  }

  #updateHorizontalPosition(drop: DropComponent, position: PositionComponent, zigzag: ZigzagComponent) {
    const visualRadius = Math.min(drop.visualRadius, this.#dropArea.width / 2)
    const amplitudeX = getZigzagAmplitude(zigzag.amplitudeX, visualRadius, this.#dropArea.width)
    const minCenterX = this.#dropArea.left + visualRadius + amplitudeX
    const maxCenterX = this.#dropArea.right - visualRadius - amplitudeX
    const traveledY = position.y - zigzag.startY
    const waveProgress = traveledY / zigzag.wavelengthY
    const angle = zigzag.phase + waveProgress * Math.PI * 2

    zigzag.centerX = MathTools.clamp(zigzag.centerX, minCenterX, maxCenterX)
    position.x = zigzag.centerX + Math.sin(angle) * amplitudeX
  }
}

export {getZigzagAmplitude}
