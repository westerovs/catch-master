import levelsConfig from '@/game/config/levels.json'
import localesConfig from '@/game/config/locales.json'

// todo переименовать

export default class GameConfig {
  static instance: GameConfig | undefined

  #locale = 'en'
  #levelConfigurationPromise: Promise<void> | null = null

  declare levels: typeof levelsConfig
  declare locales: typeof localesConfig

  constructor() {
    if (typeof GameConfig.instance === 'object') {
      return GameConfig.instance
    }

    GameConfig.instance = this
    return GameConfig.instance
  }

  set locale(locale: string) {
    this.#locale = locale
  }

  get locale() {
    return this.#locale
  }

  loadLevelsJson = async () => {
    this.levels = levelsConfig
  }

  loadLevelConfiguration = () => {
    if (!this.#levelConfigurationPromise) {
      this.#levelConfigurationPromise = this.loadLevelsJson().catch((error) => {
        this.#levelConfigurationPromise = null
        throw error
      })
    }

    return this.#levelConfigurationPromise
  }

  loadLocalesJson = async () => {
    this.locales = localesConfig
  }
}
