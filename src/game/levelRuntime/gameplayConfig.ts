import {DROP_ITEMS_LIST, type DropItemName} from '@/game/generatedAssets/dropItemsList.ts'

// Файл содержит основные настройки игрового процесса и доступных items.

// Четыре уровня сложности циклически назначаются предметам из DROP_ITEMS_LIST: выше скорость — больше награда.
const DROP_VARIANTS = [
  {fallSpeedY: 240, points: 10, scoreColor: 0x66d17a},
  {fallSpeedY: 300, points: 20, scoreColor: 0xffd166},
  {fallSpeedY: 360, points: 30, scoreColor: 0xff9f43},
  {fallSpeedY: 420, points: 40, scoreColor: 0x63b3ff},
] as const

// Параметры раунда
const ROUND_DURATION_SECONDS = 60
// Вредные предметы
const HARMFUL_DROP_ITEMS: readonly DropItemName[] = ['mushroom']
const HARMFUL_DROP_POINTS = -100
const HARMFUL_DROP_SCORE_COLOR = 0xff4d4d
// Размеры областей столкновения в пикселях
const BASKET_COLLISION_WIDTH = 160
const BASKET_COLLISION_HEIGHT = 100
const DROP_COLLISION_WIDTH = 100
const DROP_COLLISION_HEIGHT = 110
// Скорость вращения items в радианах в секунду
const DROP_ROTATION_SPEED_MIN = 0.8
const DROP_ROTATION_SPEED_MAX = 2.2
// Параметры зигзага. Применяется к избранным items
const ZIGZAG_DROP_ITEMS: readonly DropItemName[] = ['banana', 'strawberry', 'star-fruit', 'coconut', 'black-cherry', 'black-berry-dark']
const DROP_ZIGZAG_AMPLITUDE_X = 210
const DROP_ZIGZAG_WAVELENGTH_Y = 400

type ZigzagConfig = {
  readonly amplitudeX: number
  readonly wavelengthY: number
}

type DropConfig = {
  readonly textureName: DropItemName
  readonly fallSpeedY: number
  readonly points: number
  readonly scoreColor: number
  readonly collisionWidth: number
  readonly collisionHeight: number
  readonly zigzag: ZigzagConfig | null
}

// Шаблон создания items
const createDropConfig = (textureName: DropItemName, index: number): DropConfig => {
  const variantIndex = index % DROP_VARIANTS.length
  const variant = DROP_VARIANTS[variantIndex] ?? DROP_VARIANTS[0]
  const isHarmfulItem = HARMFUL_DROP_ITEMS.includes(textureName)
  const hasZigzag = ZIGZAG_DROP_ITEMS.includes(textureName)

  return {
    textureName,
    fallSpeedY: variant.fallSpeedY,
    points: isHarmfulItem ? HARMFUL_DROP_POINTS : variant.points,
    scoreColor: isHarmfulItem ? HARMFUL_DROP_SCORE_COLOR : variant.scoreColor,
    collisionWidth: DROP_COLLISION_WIDTH,
    collisionHeight: DROP_COLLISION_HEIGHT,
    zigzag: hasZigzag
      ? {
          amplitudeX: DROP_ZIGZAG_AMPLITUDE_X,
          wavelengthY: DROP_ZIGZAG_WAVELENGTH_Y,
        }
      : null,
  }
}

const DROP_CATALOG: readonly DropConfig[] = DROP_ITEMS_LIST.map(createDropConfig)

const createWeightedDropCatalog = (harmfulItemWeight: number): readonly DropConfig[] => {
  return DROP_CATALOG.flatMap((dropConfig) => {
    const weight = HARMFUL_DROP_ITEMS.includes(dropConfig.textureName) ? harmfulItemWeight : 1
    return Array.from({length: weight}, () => dropConfig)
  })
}

export {
  BASKET_COLLISION_HEIGHT,
  BASKET_COLLISION_WIDTH,
  createWeightedDropCatalog,
  DROP_COLLISION_HEIGHT,
  DROP_COLLISION_WIDTH,
  DROP_ROTATION_SPEED_MAX,
  DROP_ROTATION_SPEED_MIN,
  ROUND_DURATION_SECONDS,
}

export type {DropConfig}
