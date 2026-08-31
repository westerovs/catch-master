import type {StorageKey} from '@/game/engine/storage/defaultData.ts'

type SaveData = Record<string, unknown>

const createProfileProxy = <T extends object>(profile: T, name = 'GameData'): T => {
  return new Proxy(profile, {
    get(target, prop) {
      if (!(prop in target)) {
        console.error(`[${name}] ⚠️ Access to unknown key: ${String(prop)}`)
      }
      return Reflect.get(target, prop)
    },
    set(target, prop, value) {
      if (!(prop in target)) {
        console.warn(`[${name}] ⚠️ Setting unknown key: ${String(prop)}`)
      }
      return Reflect.set(target, prop, value)
    },
  })
}

// свежесть данных
const getMaxFreshData = (dataArray: SaveData[]) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return {}

  const withDates = dataArray.filter((save) => typeof save?.savedAt === 'string')
  if (withDates.length === 0) return null

  const dates = withDates.map((save) => new Date(String(save.savedAt)).getTime())
  const maxFreshSave = Math.max(...dates)

  const result = withDates.find((save) => new Date(String(save.savedAt)).getTime() === maxFreshSave)
  return result || null
}

const getMaxUserLevelData = (dataArray: SaveData[]) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return null

  return dataArray.reduce<SaveData | null>((max, curr) => {
    const nCurr = Number(curr?.userLevel)
    if (!Number.isFinite(nCurr)) return max

    const nMax = Number(max?.userLevel)
    if (!Number.isFinite(nMax)) return curr

    return nCurr > nMax ? curr : max
  }, null)
}

const parseJsonKey = (data: SaveData, key: StorageKey) => {
  const raw = data?.[key]
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string' || raw.trim() === '') return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const stringifyJsonKey = (storageObject: unknown) => {
  if (typeof storageObject === 'string') return storageObject
  if (!Array.isArray(storageObject)) return '[]'

  try {
    return JSON.stringify(storageObject)
  } catch {
    return '[]'
  }
}

const parseJSON = (str: string): unknown => {
  let res: unknown = null

  try {
    res = JSON.parse(str)
  } catch (e) {
    console.error(e)
  }

  return res
}

export {createProfileProxy, getMaxFreshData, getMaxUserLevelData, parseJSON, parseJsonKey, stringifyJsonKey}
