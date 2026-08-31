// значения соответствуют карточкам в магазине
const store = {
  // others hints
  dartsHint: {
    id: 'dartsHint',
    amount: 3,
  },
  compassHint: {
    id: 'compassHint',
    amount: 3,
  },

  // money
  coinLarge: {
    id: 'coinLarge',
    amount: 5000,
  },
  coinXL: {
    id: 'coinXL',
    amount: 12000,
  },

  // magnifiers
  free: {
    id: 'free',
    amount: 3,
  },
  smallPack: {
    id: 'smallPack',
    amount: 5,
  },
  mediumPack: {
    id: 'mediumPack',
    amount: 15,
  },
  largePack: {
    id: 'largePack',
    amount: 50,
  },
  extraLargePack: {
    id: 'extraLargePack',
    amount: 100,
  },
  // AD
  noAdPack: {
    id: 'noAdPack',
  },
}

const rewardsCatalog = {
  store,
  // todo добавить анимацию
  rateUsHints: {
    id: 'rateUsHints',
    amount: 5,
  },
}

const MAGNIFIERS_IDS = [store.free.id, store.smallPack.id, store.mediumPack.id, store.largePack.id, store.extraLargePack.id]

export {MAGNIFIERS_IDS, rewardsCatalog}
