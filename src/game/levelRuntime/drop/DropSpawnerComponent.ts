/**
 * Компонент хранит состояние и настройки создания items.
 * Его задача только отсчитывать время до создания следующего item. Скорость выбирается из каталога.
 * */

export default class DropSpawnerComponent {
  readonly intervalMS: number // пауза между появлением items
  elapsedMS = 0 // сколько времени прошло после предыдущего спавна

  constructor(intervalMS: number) {
    this.intervalMS = intervalMS
  }
}
