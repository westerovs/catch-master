import {WORLD} from '@/game/config/constants.ts'
import EntityManager from '../core/EntityManager.ts'
import System from '../core/System.ts'
import PositionComponent from '../mechanics/movement/PositionComponent.ts'
import VelocityComponent from '../mechanics/movement/VelocityComponent.ts'
import RotationComponent from '../mechanics/rotation/RotationComponent.ts'
import DropComponent from './DropComponent.ts'

// Система останавливает items на нижней границе и запускает их удаление.

export default class DespawnSystem extends System {
  #onDropLanded: (entityId: string) => void

  constructor(entityManager: EntityManager, onDropLanded: (entityId: string) => void) {
    super(entityManager)
    this.#onDropLanded = onDropLanded
  }

  public update(deltaMS: number) {
    void deltaMS

    const entities = this.query(DropComponent, PositionComponent, VelocityComponent)

    entities.forEach((entity) => {
      const drop = entity.getComponent(DropComponent)
      const position = entity.getComponent(PositionComponent)
      const velocity = entity.getComponent(VelocityComponent)
      const rotation = entity.getComponent(RotationComponent)

      if (!drop || !position || !velocity) return
      if (position.y + drop.collisionHeight / 2 < WORLD.HEIGHT) return

      position.y = WORLD.HEIGHT - drop.collisionHeight / 2
      velocity.x = 0
      velocity.y = 0

      if (rotation) rotation.angularSpeed = 0

      entity.removeComponent(DropComponent)
      this.#onDropLanded(entity.id)
    })
  }
}
