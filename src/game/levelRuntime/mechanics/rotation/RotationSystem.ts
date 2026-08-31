import System from '../../core/System.ts'
import RotationComponent from './RotationComponent.ts'

// Система вращает сущности на основании их угловой скорости.

export default class RotationSystem extends System {
  public update(deltaMS: number) {
    const deltaSeconds = deltaMS / 1000
    const entities = this.query(RotationComponent)

    entities.forEach((entity) => {
      const rotation = entity.getComponent(RotationComponent)
      if (!rotation) return

      rotation.angle += rotation.angularSpeed * deltaSeconds
    })
  }
}
