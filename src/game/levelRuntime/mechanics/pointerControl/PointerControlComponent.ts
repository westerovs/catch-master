// Компонент хранит параметры и целевую позицию управляемой указателем сущности.

export default class PointerControlComponent {
  readonly horizontalRadius: number
  targetX: number | null = null

  constructor(horizontalRadius: number) {
    this.horizontalRadius = horizontalRadius
  }
}
