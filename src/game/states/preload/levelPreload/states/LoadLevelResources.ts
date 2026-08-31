import type {Text} from 'pixi.js'
import type LevelPreload from '@/game/states/preload/levelPreload/LevelPreload.ts'
import {createPreloadList} from '@/game/states/preload/levelPreload/preloadList.ts'
import type {PreloadTextData} from '@/game/states/preload/levelPreload/states/PreparePreloadText.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.ts'

// [STATE 3] Загрузка всех ресурсов уровня

export default class LoadLevelResources {
  #levelEntity: LevelPreload
  #preloadList!: ReturnType<typeof createPreloadList>
  #preloadText: Text | null
  #preloadTextData: PreloadTextData
  #isNeedUpdateProgress: boolean

  constructor(levelEntity: LevelPreload, isNeedUpdateProgress = true) {
    if (!levelEntity.view) console.error('[LoadLevelResources]: preload screen is missing, progress hidden')
    if (!levelEntity.textPreloadData) console.error('[LoadLevelResources]: preload text is missing, using empty text')

    this.#levelEntity = levelEntity
    this.#preloadText = levelEntity.view?.refs.preloadText ?? null
    this.#preloadTextData = levelEntity.textPreloadData ?? {
      textLevel: '',
      userLevel: levelEntity.storage?.userLevel ?? 1,
      textLoading: '',
    }
    this.#isNeedUpdateProgress = isNeedUpdateProgress
  }

  execute = async (levelIndex: number) => {
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        const preloadList = this.#getPreloadList(levelIndex)
        if (!preloadList) return

        this.#preloadList = preloadList
        await this.#loadLevelAssets()

        this.#updateProgress(100)
        break
      } catch (err) {
        attempts++
        await GameUtils.showTextPreloadAttempts(this.#preloadText, attempts, maxAttempts, err)
      }
    }
  }

  #loadLevelAssets = async () => {
    const {levelList, sessionList, spineLevelData} = this.#preloadList
    this.#updateProgress(0)
    this.#updateProgress(20)
    await Promise.all([LoadUtils.loadSessionAssets(sessionList), LoadUtils.loadLevelBundle(spineLevelData.levelName, levelList)])
  }

  #getPreloadList = (levelIndex: number) => {
    const storage = this.#levelEntity.storage
    if (!storage) {
      console.error('[LoadLevelResources]: storage is unavailable, asset loading aborted')
      return null
    }

    return createPreloadList(this.#levelEntity.game, storage, levelIndex)
  }

  #updateProgress = (progress: number) => {
    if (!this.#isNeedUpdateProgress) return
    if (!this.#preloadText) return

    const {textLevel, userLevel, textLoading} = this.#preloadTextData

    const preloadText = this.#preloadText
    preloadText.text = `${textLevel} ${userLevel}\n${textLoading} ${progress}%`
  }
}
