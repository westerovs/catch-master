import {Assets, Texture, type UnresolvedAsset} from 'pixi.js'
import {ASSETS_URL} from '../../config/constants.ts'
import {getAtlasResolutionSuffix} from '../../config/resolutionConfig.mjs'
import SdkManager from '../../engine/SdkManager.ts'
import {CACHE_VERSION} from '../../generatedAssets/buildMeta.ts'
import GameUtils from './GameUtils.ts'

const spriteSheetPromises = new Map<string, Promise<void>>()
const textureClass = Texture as typeof Texture & {
  fromURL: (url: string) => Promise<Texture>
}

export default class LoadUtils {
  static #getLevelBundleName(levelName: string) {
    return `levelBundle_${levelName}`
  }

  static async loadSessionAssets(assets: UnresolvedAsset[]) {
    await Assets.load(assets)
  }

  static async loadLevelBundle(levelName: string, assets: UnresolvedAsset[]) {
    if (assets.length === 0) return

    const bundleName = LoadUtils.#getLevelBundleName(levelName)
    if (!Assets.resolver.hasBundle(bundleName)) Assets.addBundle(bundleName, assets)

    await Assets.loadBundle(bundleName)
  }

  static async unloadLevelBundle(levelName: string) {
    const bundleName = LoadUtils.#getLevelBundleName(levelName)
    if (!Assets.resolver.hasBundle(bundleName)) return

    try {
      await Assets.unloadBundle(bundleName)
    } catch (error) {
      console.error(`[unloadLevelBundle]: failed to unload ${bundleName}`, error)
    }
  }

  static forceFreshCache = (url: string) => {
    if (SdkManager.flags.disableFreshCache) return url

    const assetsVer = CACHE_VERSION
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${assetsVer}`
  }

  static loadJson = async (url: string) => {
    const finalUrl = LoadUtils.forceFreshCache(url)

    const response = await fetch(finalUrl, {cache: 'no-store'})
    if (!response.ok) console.error(`Failed to load JSON: ${response.status}`)

    return await response.json()
  }

  static loadAtlas = async (url: string) => {
    const finalUrl = LoadUtils.forceFreshCache(url)

    const response = await fetch(finalUrl)
    if (!response.ok) console.error(`Failed to load .atlas: ${response.status}`)
    return await response.text() // Загружаем как текст
  }

  static loadTexture = async (url: string) => {
    return new Promise<Texture>((resolve, reject) => {
      textureClass
        .fromURL(url)
        .then((loadedTexture) => {
          resolve(loadedTexture)
        })
        .catch((error) => {
          console.warn('Failed to load texture:', error)
          reject(error)
        })
    })
  }

  static loadSpriteSheet = async ({
    spriteSheetName,
    folderPath = 'ui',
    exists = GameUtils.checkWebp('png'),
  }: {
    spriteSheetName: string
    folderPath?: string
    exists?: string
  }) => {
    const basePath = ASSETS_URL.local
    const atlasName = `${spriteSheetName}${getAtlasResolutionSuffix()}.${exists}`
    const cacheKey = `${folderPath}/${atlasName}`
    const cachedPromise = spriteSheetPromises.get(cacheKey)
    if (cachedPromise) return await cachedPromise

    const jsonUrl = `${basePath}assets/${folderPath}/${atlasName}.json`
    const atlasUrl = LoadUtils.forceFreshCache(`${basePath}assets/${folderPath}/${atlasName}`)

    const loadPromise = (async () => {
      const [json, baseTexture] = await Promise.all([
        LoadUtils.loadJson(jsonUrl),
        Assets.load({
          alias: spriteSheetName,
          src: atlasUrl,
        }),
      ])

      await GameUtils.createSpriteSheet(baseTexture, json)
    })().catch((error) => {
      spriteSheetPromises.delete(cacheKey)
      throw error
    })

    spriteSheetPromises.set(cacheKey, loadPromise)
    await loadPromise
  }
}
