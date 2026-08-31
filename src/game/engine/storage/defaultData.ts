import {PACKAGE_VERSION} from '../../generatedAssets/buildMeta.ts'

const STORAGE_KEYS = {
  version: 'version',
  userLevel: 'userLevel',
  maxScore: 'maxScore',
  coins: 'coins',
  levelIndex: 'levelIndex',
  playerId: 'playerId',
  savedAt: 'savedAt',

  // purchases
  hints: 'hints',
  hintDarts: 'hintDarts',
  hintCompass: 'hintCompass',
  hasAdPass: 'hasAdPass',
  // timer reward
  timer_RewardMagnifier: 'timer_RewardMagnifier',
  timer_RewardDarts: 'timer_RewardDarts',
  timer_RewardCompass: 'timer_RewardCompass',
  // options
  option_isPlayMusic: 'option_isPlayMusic',
  option_isPlaySFX: 'option_isPlaySFX',
} as const

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
type StorageValue = string | number | boolean | null | unknown[]
type StorageDataDefinition = {
  type: 'string' | 'number' | 'bool' | 'object' | 'array'
  value: StorageValue
}

type PlayerProfile = {
  version: string
  userLevel: number
  maxScore: number
  coins: number
  levelIndex: number
  playerId: string | null
  savedAt: string | null
  hints: number
  hintDarts: number
  hintCompass: number
  hasAdPass: boolean
  timer_RewardMagnifier: number | null
  timer_RewardDarts: number | null
  timer_RewardCompass: number | null
  option_isPlayMusic: boolean
  option_isPlaySFX: boolean
}

const DEFAULT_DATA: Record<StorageKey, StorageDataDefinition> = {
  [STORAGE_KEYS.version]: {type: 'string', value: PACKAGE_VERSION},

  [STORAGE_KEYS.userLevel]: {type: 'number', value: 1},
  [STORAGE_KEYS.maxScore]: {type: 'number', value: 0},
  [STORAGE_KEYS.coins]: {type: 'number', value: 10},
  [STORAGE_KEYS.hints]: {type: 'number', value: 3},
  [STORAGE_KEYS.hintDarts]: {type: 'number', value: 3},
  [STORAGE_KEYS.hintCompass]: {type: 'number', value: 3},
  [STORAGE_KEYS.hasAdPass]: {type: 'bool', value: false},

  [STORAGE_KEYS.levelIndex]: {type: 'number', value: 0},

  [STORAGE_KEYS.option_isPlayMusic]: {type: 'bool', value: true},
  [STORAGE_KEYS.option_isPlaySFX]: {type: 'bool', value: true},

  [STORAGE_KEYS.timer_RewardMagnifier]: {type: 'number', value: null},
  [STORAGE_KEYS.timer_RewardDarts]: {type: 'number', value: null},
  [STORAGE_KEYS.timer_RewardCompass]: {type: 'number', value: null},

  [STORAGE_KEYS.playerId]: {type: 'string', value: null},
  [STORAGE_KEYS.savedAt]: {type: 'string', value: null},
}

const DEFAULT_DATA_VALUES = Object.fromEntries(Object.entries(DEFAULT_DATA).map(([key, val]) => [key, val?.value])) as PlayerProfile

// Добавляйте сюда ключи массивов, которые нужно сериализовать перед сохранением.
const SERIALIZED_ARRAY_KEYS: readonly StorageKey[] = Object.freeze([])

export {DEFAULT_DATA, DEFAULT_DATA_VALUES, SERIALIZED_ARRAY_KEYS, STORAGE_KEYS}

export type {PlayerProfile, StorageKey, StorageValue}
