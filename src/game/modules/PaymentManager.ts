import {MAGNIFIERS_IDS, rewardsCatalog} from '@/game/config/rewardsCatalog.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import YaMetrika from '@/game/modules/metrika/YaMetrika.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

type StoreCatalog = typeof rewardsCatalog.store

export default class PaymentManager {
  static instance: PaymentManager | undefined

  #game: Game

  constructor(game: Game) {
    this.#game = game

    if (typeof PaymentManager.instance === 'object') {
      return PaymentManager.instance
    }

    PaymentManager.instance = this
    return PaymentManager.instance
  }

  // проверяет необработанные платежи при первом запуске
  consumePendingPayments = async () => {
    try {
      if (!SdkManager.isPurchaseAvailable) return

      const purchase = await SdkManager.sdk.purchase
      const pendingPayments = await purchase.getPurchases()
      if (pendingPayments.length === 0) return

      const catalog = await purchase.getCatalog()

      for (const {productID, purchaseToken} of pendingPayments) {
        if (!catalog[productID]) continue

        if (LocalStorage.isDebug) {
          console.log(
            `%c[consumePendingPayments]:%c\n ${productID},\n ${purchaseToken}`,
            'color: tomato; font-weight: bold;',
            'color: inherit;',
          )
        }

        await this.consumePurchase(productID, purchaseToken)
      }
    } catch (err) {
      console.error('[consumePendingPayments]', err)
    }
  }

  async onPurchase(id: string) {
    return this.#buy(id)
  }

  #buy = (itemId: string) => {
    const purchase = SdkManager.purchase

    return purchase
      .buy(itemId)
      .then(async ({purchaseToken}: {purchaseToken: string}) => {
        await this.consumePurchase(itemId, purchaseToken)
        return true
      })
      .catch((error: unknown) => {
        GameUtils.showError(error)
        return false
      })
  }

  consumePurchase = async (itemId: string, purchaseToken: string) => {
    const purchase = SdkManager.purchase

    try {
      await purchase.consumePurchase(purchaseToken)
      this.giveReward(itemId)

      YaMetrika.purchase(itemId)
    } catch (e) {
      console.error('[consumePurchase]', e)
      return false
    }
  }

  giveReward = (itemId: string) => {
    const {store} = rewardsCatalog

    this.#processStoreReward(store, itemId)
  }

  #processStoreReward = (store: StoreCatalog, itemId: string) => {
    if (!(itemId in store)) return false

    const reward = store[itemId as keyof StoreCatalog]
    const rewardAmount = 'amount' in reward ? reward.amount : 0

    const storage = Locator.storage
    console.log('processStoreReward')
    if (MAGNIFIERS_IDS.includes(itemId)) storage.addHints(STORAGE_KEYS.hints, rewardAmount)
    if (itemId === store.dartsHint.id) storage.addHints(STORAGE_KEYS.hintDarts, rewardAmount)
    if (itemId === store.compassHint.id) storage.addHints(STORAGE_KEYS.hintCompass, rewardAmount)
    // coins
    if (itemId === store.coinLarge.id) storage.addHints(STORAGE_KEYS.coins, rewardAmount)
    if (itemId === store.coinXL.id) storage.addHints(STORAGE_KEYS.coins, rewardAmount)

    // пропуск рекламы
    if (itemId === store.noAdPack.id) {
      storage.playerData.hasAdPass = true
      storage.save(true)
      this.#game.emit(GAME_EVENTS.paymentManager.hasNoAdsPass, itemId)
    }
  }
}
