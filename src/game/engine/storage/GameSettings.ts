import type Storage from './Storage.ts'

export default class GameSettings {
  #storage: Storage

  constructor(storage: Storage) {
    this.#storage = storage
  }

  toggleMusic = () => {
    this.#storage.playerData.option_isPlayMusic = !this.#storage.playerData.option_isPlayMusic
    this.#storage.save()
  }

  toggleSFX = () => {
    this.#storage.playerData.option_isPlaySFX = !this.#storage.playerData.option_isPlaySFX
    this.#storage.save()
  }
}
