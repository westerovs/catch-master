// Компонент хранит текущий угол и скорость вращения сущности.

export default class RotationComponent {
  angle: number // текущий угол в радианах
  angularSpeed: number // скорость вращения в радианах в секунду

  constructor(angle: number, angularSpeed: number) {
    this.angle = angle
    this.angularSpeed = angularSpeed
  }
}
