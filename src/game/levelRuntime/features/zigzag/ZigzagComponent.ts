// Компонент хранит параметры зигзагообразной траектории сущности.

export default class ZigzagComponent {
  centerX: number // центральная координата траектории
  readonly startY: number // начальная координата падения
  readonly amplitudeX: number // отклонение по горизонтали в пикселях
  readonly wavelengthY: number // высота одного полного периода
  readonly phase: number // начальная фаза в радианах

  constructor(centerX: number, startY: number, amplitudeX: number, wavelengthY: number, phase: number) {
    this.centerX = centerX
    this.startY = startY
    this.amplitudeX = amplitudeX
    this.wavelengthY = wavelengthY
    this.phase = phase
  }
}
