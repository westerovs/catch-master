type Component = object

type ComponentType<TComponent extends Component = Component> = abstract new (...args: any[]) => TComponent

export default class Entity {
  readonly id: string

  #components = new Map<ComponentType, Component>()

  constructor(id: string) {
    this.id = id
  }

  public addComponent<TComponent extends Component>(component: TComponent) {
    const componentType = component.constructor as ComponentType<TComponent>
    this.#components.set(componentType, component)
    return this
  }

  public removeComponent<TComponent extends Component>(componentType: ComponentType<TComponent>) {
    return this.#components.delete(componentType)
  }

  public getComponent<TComponent extends Component>(componentType: ComponentType<TComponent>) {
    return this.#components.get(componentType) as TComponent | undefined
  }

  public hasComponent(componentType: ComponentType) {
    return this.#components.has(componentType)
  }

  public hasComponents(componentTypes: ComponentType[]) {
    return componentTypes.every((componentType) => this.hasComponent(componentType))
  }

  public clearComponents() {
    this.#components.clear()
  }
}

export type {
  // Тип конструктора компонента.
  ComponentType,
}
