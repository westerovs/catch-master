import System from './System.ts'

export default class SystemManager {
  #systems = new Map<string, System>()
  #isInitialized = false

  get systems(): ReadonlyMap<string, System> {
    return this.#systems
  }

  public addSystem(name: string, system: System) {
    if (this.#systems.has(name)) {
      throw new Error(`System with name '${name}' already exists`)
    }

    this.#systems.set(name, system)
    if (this.#isInitialized) system.init()
  }

  public initSystems() {
    if (this.#isInitialized) return

    this.#isInitialized = true
    this.#systems.forEach((system) => system.init())
  }

  public update(deltaMS: number) {
    if (!this.#isInitialized) return

    this.#systems.forEach((system) => system.update(deltaMS))
  }

  public removeSystem(name: string) {
    const system = this.#systems.get(name)
    if (!system) return false

    system.destroy()
    return this.#systems.delete(name)
  }

  public removeAllSystems() {
    this.#systems.forEach((system) => system.destroy())
    this.#systems.clear()
    this.#isInitialized = false
  }
}
