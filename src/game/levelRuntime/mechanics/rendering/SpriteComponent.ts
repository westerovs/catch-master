export default class SpriteComponent {
  readonly textureName: string
  readonly label: string
  readonly anchorX: number
  readonly anchorY: number

  constructor(textureName: string, label: string, anchorX = 0.5, anchorY = 0.5) {
    this.textureName = textureName
    this.label = label
    this.anchorX = anchorX
    this.anchorY = anchorY
  }
}
