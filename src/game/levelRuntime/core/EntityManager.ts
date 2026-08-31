import Entity, {type ComponentType} from './Entity.ts'

export default class EntityManager {
  #entities = new Map<string, Entity>()
  #nextEntityId = 1

  get entities(): ReadonlyMap<string, Entity> {
    return this.#entities
  }

  public createEntity(id = this.#createEntityId()) {
    if (this.#entities.has(id)) {
      throw new Error(`Entity with id '${id}' already exists`)
    }

    const entity = new Entity(id)
    this.#entities.set(id, entity)
    return entity
  }

  public getEntity(id: string) {
    return this.#entities.get(id)
  }

  public removeEntity(id: string) {
    const entity = this.#entities.get(id)
    if (!entity) return false

    entity.clearComponents()
    return this.#entities.delete(id)
  }

  // возвращает все Entity, содержащие все переданные ComponentType
  public query(...componentTypes: ComponentType[]) {
    return [...this.#entities.values()].filter((entity) => entity.hasComponents(componentTypes))
  }

  public clear() {
    this.#entities.forEach((entity) => entity.clearComponents())
    this.#entities.clear()
  }

  #createEntityId() {
    const id = `entity-${this.#nextEntityId}`
    this.#nextEntityId += 1
    return id
  }
}
