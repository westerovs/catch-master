// Компонент обозначает корзину и хранит размеры её зоны ловли.

export default class BasketComponent {
  readonly catchWidth: number // ширина зоны ловли
  readonly catchHeight: number // высота зоны ловли

  constructor(catchWidth: number, catchHeight: number) {
    this.catchWidth = catchWidth
    this.catchHeight = catchHeight
  }
}
