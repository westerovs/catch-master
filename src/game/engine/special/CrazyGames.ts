import {WORLD} from '../../config/constants.ts'
import Locator from '../Locator.ts'
import SdkManager from '../SdkManager.ts'
import LocalStorage from '../storage/LocalStorage.ts'

type AdaptiveBannerArea = {
  x: number
  y: number
  width: number
  height: number
}

export default class CrazyGames {
  static isInit = false

  static init = () => {
    CrazyGames.isInit = true
  }

  static showCrazyGamesBanner = () => {
    if (!CrazyGames.isInit) return
    CrazyGames.createCrazyGamesBanner()
    window.addEventListener('resize', CrazyGames.createCrazyGamesBanner)
  }

  static hideAllAdaptiveBanners = () => {
    if (!CrazyGames.isInit) return
    window.removeEventListener('resize', CrazyGames.createCrazyGamesBanner)
    SdkManager.adapter.advertising.hideAllAdaptiveBanners()
  }

  static createCrazyGamesBanner = () => {
    if (LocalStorage.isDebug) SdkManager.adapter.advertising.debugAdaptiveBanners()

    const {x, y, width, height} = CrazyGames.resizeCGBanner()
    SdkManager.adapter.advertising.setAdaptiveBannersAreas([{x, y, width, height}])
    SdkManager.adapter.advertising.showAllAdaptiveBanners()
  }

  static resizeCGBanner = () => {
    const {scaleFactor} = Locator.gameResize.resizeData

    const width = Math.min(window.innerWidth / 4, (WORLD.WIDTH / 4) * scaleFactor)
    const height = window.innerHeight / 1.2
    const contentOffset = 350

    return {
      x: window.innerWidth / 2 + contentOffset * scaleFactor,
      y: window.innerHeight / 2 - height / 2,
      width,
      height,
    }
  }

  static setAdaptiveBannersAreas = (areas: AdaptiveBannerArea[] = []) => {
    SdkManager.adapter.advertising.setAdaptiveBannersAreas(areas)
  }

  static showAllAdaptiveBanners = () => {
    SdkManager.adapter.advertising.showAllAdaptiveBanners()
  }
}
