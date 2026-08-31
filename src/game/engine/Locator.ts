import type UiLayer from '@/game/engine/uiLayer/UiLayer.ts'
import type GameConfig from '../config/GameConfig.ts'
import type Game from '../Game.ts'
import type PaymentManager from '../modules/PaymentManager.ts'
import type Options from '../ui/common/options/Options.ts'
import type SoundManager from './audio/SoundManager.ts'
import type GameResize from './GameResize.ts'
import type Storage from './storage/Storage.ts'

type Service = {
  name: string
  instance: unknown
}

export const SERVICES = {
  GAME: 'GAME',
  GAME_RESIZE: 'GAME_RESIZE',
  STORAGE: 'storage',
  OPTIONS: 'options',
  SOUND_MANAGER: 'soundManager',
  GAME_CONFIG: 'gameConfig',
  PAYMENT_MANAGER: 'PAYMENT_MANAGER',
  UI_LAYER: 'UI_LAYER',
}

export default class Locator {
  static services: Set<Service> = new Set()

  static register(name: string, instance: unknown) {
    const service = {name, instance}
    if (![...Locator.services].some((service) => service.name === name)) {
      Locator.services.add(service)
    }
  }

  static get(name: string) {
    const service = [...Locator.services].find((service) => service.name === name)
    return service ? service.instance : undefined
  }

  static get game(): Game {
    return Locator.get(SERVICES.GAME) as Game
  }

  static get gameResize(): GameResize {
    return Locator.get(SERVICES.GAME_RESIZE) as GameResize
  }

  static get storage(): Storage {
    return Locator.get(SERVICES.STORAGE) as Storage
  }

  static get options(): Options {
    return Locator.get(SERVICES.OPTIONS) as Options
  }

  static get soundManager(): SoundManager {
    return Locator.get(SERVICES.SOUND_MANAGER) as SoundManager
  }

  static get gameConfig(): GameConfig {
    return Locator.get(SERVICES.GAME_CONFIG) as GameConfig
  }

  static get paymentManager(): PaymentManager {
    return Locator.get(SERVICES.PAYMENT_MANAGER) as PaymentManager
  }

  static get uiLayer(): UiLayer {
    return Locator.get(SERVICES.UI_LAYER) as UiLayer
  }
}
