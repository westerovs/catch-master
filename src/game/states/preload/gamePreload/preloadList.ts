import {ASSETS_URL, GAME_NAMES} from '../../../config/constants.ts'
import {GAME_NAME} from '../../../generatedAssets/buildMeta.ts'

export const createPreloadList = () => {
  const basePath = ASSETS_URL.local
  const isHotel = GAME_NAME === GAME_NAMES.hotel
  const secondaryFontName = isHotel ? 'primaryFont' : 'secondaryFont'

  return {
    bundles: [
      {
        name: 'gameScreen',
        assets: [
          {alias: 'startScreen', src: `${basePath}assets/images/startScreen.webp`},
          // главный шрифт
          {alias: 'primaryFont', src: `${basePath}assets/fonts/primaryFont.woff2`},
        ],
      },
      // второстепенный шрифт, он идёт через ленивую загрузку, т.к встречается только в уровне
      {
        name: 'secondaryFont',
        assets: [{alias: 'secondaryFont', src: `${basePath}assets/fonts/${secondaryFontName}.woff2`}],
      },
    ],
  }
}
