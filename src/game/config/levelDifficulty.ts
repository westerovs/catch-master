import {LEVEL_TYPES, type LevelTypeData} from './constants.ts'

type LevelDifficultyConfig = {
  readonly levelType: LevelTypeData
  readonly spawnIntervalMS: number
  readonly fallSpeedMultiplier: number
  readonly harmfulItemWeight: number
}

/**
 * Сложность выбирается по номеру уровня и повторяется циклом:
 * обычный → hard → veryHard → extreme. Профиль одновременно управляет бейджем,
 * частотой спавна, скоростью падения и весом вредного предмета.
 */
const LEVEL_DIFFICULTY_CYCLE = [
  {levelType: LEVEL_TYPES.DEFAULT, spawnIntervalMS: 1000, fallSpeedMultiplier: 1, harmfulItemWeight: 1},
  {levelType: LEVEL_TYPES.HARD, spawnIntervalMS: 900, fallSpeedMultiplier: 1.1, harmfulItemWeight: 1},
  {levelType: LEVEL_TYPES.VERY_HARD, spawnIntervalMS: 800, fallSpeedMultiplier: 1.2, harmfulItemWeight: 2},
  {levelType: LEVEL_TYPES.EXTREME, spawnIntervalMS: 700, fallSpeedMultiplier: 1.3, harmfulItemWeight: 3},
] as const satisfies readonly LevelDifficultyConfig[]

const getLevelDifficultyConfig = (levelNumber: number): LevelDifficultyConfig => {
  const cycleIndex = (levelNumber - 1) % LEVEL_DIFFICULTY_CYCLE.length
  return LEVEL_DIFFICULTY_CYCLE[cycleIndex] ?? LEVEL_DIFFICULTY_CYCLE[0]
}

export {getLevelDifficultyConfig}

export type {LevelDifficultyConfig}
