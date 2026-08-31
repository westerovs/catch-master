import {Color, type ColorSource} from 'pixi.js'
import {ColorOverlayFilter, OutlineFilter} from 'pixi-filters'

type NamedFilter<T> = T & {name: string}

export default class Filters {
  static colorOverlay = (hex = 0xfff111, alpha = 1) => {
    const color = new Color(hex).toNumber()
    const colorOverlayFilter = new ColorOverlayFilter({color, alpha}) as NamedFilter<ColorOverlayFilter>
    colorOverlayFilter.name = 'colorOverlay'

    return colorOverlayFilter
  }

  static outlineFilter = (thickness: number, color: ColorSource) => {
    const outlineFilter = new OutlineFilter({thickness, color}) as NamedFilter<OutlineFilter>
    outlineFilter.name = 'outlineFilter'

    return outlineFilter
  }
}
