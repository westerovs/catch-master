import type {UnresolvedAsset} from 'pixi.js'
import LevelConfig from '@/game/config/LevelConfig.ts'
import type Storage from '@/game/engine/storage/Storage.ts'
import type Game from '@/game/Game.ts'

// при формировании листа берет отфильтрованные уровни по флагам из LevelConfig (а в нем ABTest)
const createPreloadList = (game: Game, storage: Storage, levelIndex: number) => {
  void game
  void storage
  const spineLevelData = LevelConfig.getGameLevelData(levelIndex)

  const {background} = spineLevelData

  return {
    spineLevelData,

    // Сессионные ассеты кешируются до закрытия игры и не выгружаются вместе с уровнем.
    sessionList: [background] satisfies UnresolvedAsset[],
    levelList: [] as UnresolvedAsset[],
  }
}

export {createPreloadList}
