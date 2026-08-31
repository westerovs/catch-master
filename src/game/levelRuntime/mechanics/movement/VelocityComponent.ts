// Компонент хранит скорость движения сущности в пикселях в секунду.
export default class VelocityComponent {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}
