import {Cache, type Rectangle, Texture} from 'pixi.js'
import {getRandomItem} from '@/game/utils/commonUtils.ts'
import MathTools from '@/game/utils/MathTools.ts'
import EntityManager from '../core/EntityManager.ts'
import System from '../core/System.ts'
import ZigzagComponent from '../features/zigzag/ZigzagComponent.ts'
import {getZigzagAmplitude} from '../features/zigzag/ZigzagSystem.ts'
import {DROP_ROTATION_SPEED_MAX, DROP_ROTATION_SPEED_MIN, type DropConfig} from '../gameplayConfig.ts'
import PositionComponent from '../mechanics/movement/PositionComponent.ts'
import VelocityComponent from '../mechanics/movement/VelocityComponent.ts'
import SpriteComponent from '../mechanics/rendering/SpriteComponent.ts'
import RotationComponent from '../mechanics/rotation/RotationComponent.ts'
import DropComponent from './DropComponent.ts'
import DropSpawnerComponent from './DropSpawnerComponent.ts'

// Система создаёт items через заданные интервалы времени.

const SPAWN_Y = -100

type DropSpawnSystemOptions = {
  dropCatalog: readonly DropConfig[]
  fallSpeedMultiplier: number
}

// todo для мобильных и пк устройств разное кол-во одновременно падающих items

export default class DropSpawnSystem extends System {
  readonly #dropArea: Rectangle
  readonly #dropCatalog: readonly DropConfig[]
  readonly #fallSpeedMultiplier: number

  constructor(entityManager: EntityManager, dropArea: Rectangle, {dropCatalog, fallSpeedMultiplier}: DropSpawnSystemOptions) {
    super(entityManager)
    this.#dropArea = dropArea
    this.#dropCatalog = dropCatalog
    this.#fallSpeedMultiplier = fallSpeedMultiplier
  }

  public update(deltaMS: number) {
    const entities = this.query(DropSpawnerComponent)

    entities.forEach((entity) => {
      const spawner = entity.getComponent(DropSpawnerComponent)
      if (spawner) this.#updateSpawner(spawner, deltaMS)
    })
  }

  #updateSpawner(spawner: DropSpawnerComponent, deltaMS: number) {
    spawner.elapsedMS += deltaMS
    if (spawner.elapsedMS < spawner.intervalMS) return

    spawner.elapsedMS -= spawner.intervalMS
    this.#spawnDrop()
  }

  #spawnDrop() {
    const dropConfig = getRandomItem(this.#dropCatalog)
    if (!dropConfig) {
      console.error('[DropSpawnSystem]: drop config is missing')
      return
    }

    this.#createDrop(dropConfig)
  }

  #createDrop(dropConfig: DropConfig) {
    const visualRadius = this.#getVisualRadius(dropConfig)
    const centerX = this.#getSpawnCenterX(dropConfig, visualRadius)
    const zigzag = this.#createZigzag(dropConfig, centerX)
    const amplitudeX = zigzag ? getZigzagAmplitude(zigzag.amplitudeX, visualRadius, this.#dropArea.width) : 0
    const startX = zigzag ? centerX + Math.sin(zigzag.phase) * amplitudeX : centerX

    const dropEntity = this.entityManager.createEntity()

    dropEntity.addComponent(new PositionComponent(startX, SPAWN_Y))
    dropEntity.addComponent(new SpriteComponent(dropConfig.textureName, `drop-${dropEntity.id}`))
    dropEntity.addComponent(new VelocityComponent(0, dropConfig.fallSpeedY * this.#fallSpeedMultiplier))
    dropEntity.addComponent(
      new DropComponent(dropConfig.collisionWidth, dropConfig.collisionHeight, dropConfig.points, dropConfig.scoreColor, visualRadius),
    )
    dropEntity.addComponent(this.#createRandomRotation())
    if (zigzag) dropEntity.addComponent(zigzag)
  }

  #getSpawnCenterX(dropConfig: DropConfig, visualRadius: number) {
    const configuredAmplitudeX = dropConfig.zigzag?.amplitudeX ?? 0
    const amplitudeX = getZigzagAmplitude(configuredAmplitudeX, visualRadius, this.#dropArea.width)
    const radius = Math.min(visualRadius, this.#dropArea.width / 2)
    const minX = this.#dropArea.left + radius + amplitudeX
    const maxX = this.#dropArea.right - radius - amplitudeX

    return MathTools.getRandomNumber(minX, maxX, 0)
  }

  #getVisualRadius(dropConfig: DropConfig) {
    const cachedAsset = Cache.get(dropConfig.textureName)
    const texture = cachedAsset instanceof Texture ? cachedAsset : cachedAsset?.texture

    if (!(texture instanceof Texture)) {
      console.error(`[DropSpawnSystem]: texture '${dropConfig.textureName}' is missing`)
      return Math.hypot(dropConfig.collisionWidth, dropConfig.collisionHeight) / 2
    }

    return Math.hypot(texture.width, texture.height) / 2
  }

  #createZigzag(dropConfig: DropConfig, centerX: number) {
    const config = dropConfig.zigzag
    if (!config) return null

    const phase = MathTools.getRandomNumber(0, Math.PI * 2)
    return new ZigzagComponent(centerX, SPAWN_Y, config.amplitudeX, config.wavelengthY, phase)
  }

  #createRandomRotation() {
    const angle = MathTools.getRandomNumber(0, Math.PI * 2)
    const direction = Math.random() < 0.5 ? -1 : 1
    const angularSpeed = MathTools.getRandomNumber(DROP_ROTATION_SPEED_MIN, DROP_ROTATION_SPEED_MAX) * direction

    return new RotationComponent(angle, angularSpeed)
  }
}
