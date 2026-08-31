import System from '../../core/System.ts'
import PositionComponent from './PositionComponent.ts'
import VelocityComponent from './VelocityComponent.ts'

// Система изменяет положение сущностей на основании их скорости.

export default class MovementSystem extends System {
  public update(deltaMS: number) {
    const deltaSeconds = deltaMS / 1000
    const entities = this.query(PositionComponent, VelocityComponent)

    entities.forEach((entity) => {
      const position = entity.getComponent(PositionComponent)
      const velocity = entity.getComponent(VelocityComponent)

      this.#moveEntity(position, velocity, deltaSeconds)
    })
  }

  #moveEntity(position: PositionComponent | undefined, velocity: VelocityComponent | undefined, deltaSeconds: number) {
    if (!position || !velocity) return

    position.x += velocity.x * deltaSeconds
    position.y += velocity.y * deltaSeconds
  }
}
