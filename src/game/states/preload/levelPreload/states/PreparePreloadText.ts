import i18next from 'i18next'
import type Storage from '@/game/engine/storage/Storage.ts'
import type LevelPreload from '@/game/states/preload/levelPreload/LevelPreload.ts'

// [STATE 2] Подготовка списка и данных для загрузки конкретного уровня

type PreloadTextData = {
  textLevel: string
  userLevel: number
  textLoading: string
}

export default class PreparePreloadText {
  #storage: Storage | null
  #textPreloadData!: PreloadTextData

  constructor(levelEntity: LevelPreload) {
    if (!levelEntity.storage) console.error('[PreparePreloadText]: storage is unavailable, using the first level')

    this.#storage = levelEntity.storage
  }

  execute = () => {
    this.#initTextPreloadData()
  }

  get textPreloadData() {
    return this.#textPreloadData
  }

  #initTextPreloadData = () => {
    const textLevel = i18next.t('level')
    const userLevel = this.#storage?.userLevel ?? 1
    const textLoading = i18next.t('textLoading')

    this.#textPreloadData = {
      textLevel,
      userLevel,
      textLoading,
    }
  }
}

export type {PreloadTextData}
