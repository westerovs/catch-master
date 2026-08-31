import type {ComponentType} from './Entity.ts'
import EntityManager from './EntityManager.ts'

export default class System {
  protected readonly entityManager: EntityManager

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager
  }

  public init() {}

  public update(deltaMS: number) {
    void deltaMS
  }

  public destroy() {}

  protected query(...componentTypes: ComponentType[]) {
    return this.entityManager.query(...componentTypes)
  }
}
