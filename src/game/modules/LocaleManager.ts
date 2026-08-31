import i18next from 'i18next'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'

type Locales = Record<string, Record<string, unknown>>

export default class LocaleManager {
  static locale = 'en'

  static get supportedLocales() {
    const locales = Locator.gameConfig.locales
    return locales ? Object.keys(locales) : []
  }

  static init = async () => {
    await LocaleManager.initializeI18n()
  }

  static initializeI18n = async () => {
    const gameConfig = Locator.gameConfig
    const locales = await gameConfig.locales

    const resources = Object.fromEntries(Object.entries(locales).map(([localeKey, translation]) => [localeKey, {translation}]))

    const locale = await SdkManager.getLang()
    const validatedLocale = LocaleManager.validate(locale, locales as Locales)

    LocaleManager.locale = validatedLocale

    await i18next.init({
      lng: validatedLocale,
      fallbackLng: 'en',
      resources,
    })
  }

  static validate(locale: string, locales: Locales) {
    const normLocale = (locale || '').toLowerCase().split('-')[0]
    const supportedLocales = Object.keys(locales)

    if (supportedLocales.includes(normLocale)) {
      return normLocale
    }

    if (supportedLocales.includes('en')) {
      console.error(`[LocaleManager]: locale ${normLocale} is not supported, using en`)
      return 'en'
    }

    const [firstLocale] = supportedLocales
    if (!firstLocale) {
      console.error('[LocaleManager]: no locales configured, using en')
      return 'en'
    }

    console.error(`[LocaleManager]: locale ${normLocale} is not supported, using ${firstLocale}`)
    return firstLocale
  }
}
