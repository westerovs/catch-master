import {Assets, type Container, Particle, ParticleContainer, Rectangle, Texture, type Ticker} from 'pixi.js'
import {GAME_NAMES} from '@/game/config/constants.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.ts'
import defaultConfig from '@/game/ui/common/emitters/magicDust/defaultConfig.json'

type MagicDustConfig = typeof defaultConfig

type MagicDustParticle = {
  particle: Particle
  age: number
  lifetime: number
  startScale: number
  endScale: number
  velocityX: number
  velocityY: number
}

export default class MagicDust {
  #config: MagicDustConfig | null = null
  #particles: MagicDustParticle[] = []
  #particleContainer: ParticleContainer<Particle> | null = null
  #spawnElapsed = 0
  #game: Game
  #parent: Container

  constructor(game: Game, parent: Container) {
    this.#game = game
    this.#parent = parent
  }

  get container() {
    return this.#particleContainer
  }

  init = () => {
    try {
      if (!this.#parent) {
        console.warn('[MagicDust: родительский контейнер не определён]')
        return
      }

      const particleContainer = this.#initializeEmitter()
      if (!particleContainer) return

      this.#parent.addChildAt(particleContainer, Math.min(1, this.#parent.children.length))
      this.#game.app.ticker.add(this.#update)
      this.#game.on(GAME_EVENTS.clearLevel, this.destroy)
    } catch (error) {
      console.error('[MagicDust]: initialization failed', error)
    }
  }

  destroy = () => {
    try {
      this.#game.app.ticker.remove(this.#update)
      this.#particles.length = 0

      if (this.#particleContainer) {
        this.#particleContainer.destroy()
        this.#particleContainer = null
      }

      this.#game.off(GAME_EVENTS.clearLevel, this.destroy)
    } catch (e) {
      console.warn('[MagicDust: ошибка при уничтожении]', e)
    }
  }

  #initializeEmitter = () => {
    try {
      const texture = (Assets.get('particle') as Texture | undefined) ?? Texture.WHITE
      const bounds = this.#parent.getLocalBounds()

      const particleColor = this.#getColorByGameName()

      this.#config = {
        ...defaultConfig,
        color: {
          start: particleColor,
          end: particleColor,
        },
      }

      const particleContainer = new ParticleContainer<Particle>({
        label: 'magicDustParticles',
        texture,
        zIndex: 1,
        boundsArea: new Rectangle(bounds.x, bounds.y, Math.max(bounds.width, 1), Math.max(bounds.height, 1)),
        dynamicProperties: {
          vertex: true,
          position: true,
          color: true,
        },
      })
      this.#particleContainer = particleContainer

      return particleContainer
    } catch (error) {
      console.error('[MagicDust]: emitter initialization failed', error)
      return null
    }
  }

  #update = (ticker: Ticker) => {
    if (!this.#particleContainer || !this.#config) return

    const delta = Math.min(ticker.deltaMS / 1000, 0.1)
    this.#spawnElapsed += delta

    while (this.#spawnElapsed >= this.#config.frequency && this.#particles.length < this.#config.maxParticles) {
      this.#spawnElapsed -= this.#config.frequency
      this.#spawnParticle()
    }

    for (let index = this.#particles.length - 1; index >= 0; index--) {
      const item = this.#particles[index]
      item.age += delta

      if (item.age >= item.lifetime) {
        this.#particleContainer.removeParticle(item.particle)
        this.#particles.splice(index, 1)
        continue
      }

      const progress = item.age / item.lifetime
      item.velocityX += this.#config.acceleration.x * delta
      item.velocityY += this.#config.acceleration.y * delta

      const speed = Math.hypot(item.velocityX, item.velocityY)
      if (this.#config.maxSpeed > 0 && speed > this.#config.maxSpeed) {
        const speedRatio = this.#config.maxSpeed / speed
        item.velocityX *= speedRatio
        item.velocityY *= speedRatio
      }

      item.particle.x += item.velocityX * delta
      item.particle.y += item.velocityY * delta
      item.particle.alpha = this.#lerp(this.#config.alpha.start, this.#config.alpha.end, progress)

      const scale = this.#lerp(item.startScale, item.endScale, progress)
      item.particle.scaleX = scale
      item.particle.scaleY = scale
    }
  }

  #spawnParticle = () => {
    const particleContainer = this.#particleContainer
    const config = this.#config
    if (!particleContainer || !config) return

    const {texture} = particleContainer
    const scaleMultiplier = this.#random(config.scale.minimumScaleMultiplier ?? 1, 1)
    const speedMultiplier = this.#random(config.speed.minimumSpeedMultiplier ?? 1, 1)
    const startScale = config.scale.start * scaleMultiplier
    const startSpeed = config.speed.start * speedMultiplier
    const particle = new Particle({
      texture,
      x: (config.pos?.x ?? 0) + Math.random() * this.#parent.width,
      y: (config.pos?.y ?? 0) + Math.random() * this.#parent.height,
      scaleX: startScale,
      scaleY: startScale,
      anchorX: 0.5,
      anchorY: 0.5,
      tint: config.color.start,
      alpha: config.alpha.start,
    })

    particleContainer.addParticle(particle)
    this.#particles.push({
      particle,
      age: 0,
      lifetime: this.#random(config.lifetime.min, config.lifetime.max),
      startScale,
      endScale: config.scale.end * scaleMultiplier,
      velocityX: startSpeed,
      velocityY: 0,
    })
  }

  #lerp = (start: number, end: number, progress: number) => start + (end - start) * progress

  #random = (min: number, max: number) => min + Math.random() * (max - min)

  #getColorByGameName = () => {
    if (GAME_NAME === GAME_NAMES.detective) return '#ffdd00'
    if (GAME_NAME === GAME_NAMES.detectiveGirl) return '#FFFFFF'

    return '#FFFFFF'
  }
}
