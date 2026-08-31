// Компонент обозначает дроп и хранит размеры его области столкновения.

export default class DropComponent {
  readonly collisionWidth: number // ширина области столкновения
  readonly collisionHeight: number // высота области столкновения
  readonly points: number // количество очков за поимку
  readonly scoreColor: number // цвет вылетающих очков
  readonly visualRadius: number // радиус, учитывающий вращение изображения

  constructor(collisionWidth: number, collisionHeight: number, points: number, scoreColor: number, visualRadius: number) {
    this.collisionWidth = collisionWidth
    this.collisionHeight = collisionHeight
    this.points = points
    this.scoreColor = scoreColor
    this.visualRadius = visualRadius
  }
}
