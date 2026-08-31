import SdkManager from '@/game/engine/SdkManager.ts'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.ts'

type SaveData = Record<string, unknown>

export default class LocalStorage {
  #localStorageName = GAME_NAME
  static _storage: globalThis.Storage | null = null

  static get isDebug() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-isDebug`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  static set isDebug(value) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-isDebug`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  init = () => {
    try {
      LocalStorage._storage = SdkManager.adapter.storage.getLocalStorage()
      this.#checkAndClear()
    } catch (err) {
      console.error('[LocalStorage]', err)
    }
  }

  #checkAndClear() {
    if (!LocalStorage._storage) return
    if (LocalStorage.isDebug) return

    LocalStorage.clear()
  }

  static clear = () => {
    const storage = LocalStorage._storage
    if (!storage) return

    const keys = [`${GAME_NAME}-isDebug`]

    keys.forEach((key) => storage.removeItem(key))
  }

  getData = async () => {
    if (!LocalStorage._storage) return

    const saves = []
    const playerId = SdkManager.getPlayerId() || null

    const serverLocalStorageData = playerId ? await this.#getServerLocalStorageData(playerId) : []
    if (serverLocalStorageData) saves.push(...serverLocalStorageData)

    const localStorageData = await this.#getBrowserLocalStorageData()
    if (localStorageData) saves.push(...localStorageData)

    return saves.filter((save) => (save?.playerId || null) === playerId)
  }

  save = (data: SaveData) => {
    if (!LocalStorage._storage) return

    try {
      LocalStorage._storage.setItem(this.#localStorageName, JSON.stringify(data))
    } catch (err) {
      console.error('[LocalStorage save]', err)
    }
  }

  #getServerLocalStorageData = async (playerId: string) => {
    if (!playerId) return []

    const saves = []
    const data = await SdkManager.getLocalStorage()

    if (data) {
      if (data[this.#localStorageName]) {
        saves.push(JSON.parse(data[this.#localStorageName]))
      }
    }

    return saves
  }

  #getBrowserLocalStorageData = async () => {
    const saves: SaveData[] = []
    const storage = LocalStorage._storage
    if (!storage) return saves

    try {
      const newItem = storage.getItem(this.#localStorageName)
      if (newItem) {
        const parsed = this.#safeParse(newItem, this.#localStorageName)
        if (parsed) saves.push(parsed)
      }
    } catch (err) {
      console.error('[LocalStorage load]', err)
    }
    return saves
  }

  #safeParse = (data: string, key: string): SaveData | null => {
    try {
      return JSON.parse(data)
    } catch (err) {
      console.error(`Failed to parse JSON for key "${key}":`, err)
      return null
    }
  }
}
