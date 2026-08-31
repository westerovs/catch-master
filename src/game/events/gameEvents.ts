// todo - привести к единообразию
const GAME_EVENTS = {
  checkoutState: 'checkoutState',
  firstClick: 'firstClick',
  gameResize: 'gameResize',
  isDebug: 'isDebug', // сочетание горячих клавиш, посылает сигнал компоненту

  startHit: 'startHit',
  endHit: 'endHit',

  completePartLevel: 'completePartLevel', // common
  completeLevel: 'completeLevel', // common
  completeLevelWin: 'completeLevelWin',
  clearLevel: 'clearLevel', // посылает сигнал на который подписаны все модули, они самоочищаются
  botsWin: 'botsWin', // когда боты нашли раньше игрока

  updateTargets: 'updateTargets',
  allItemsFound: 'allItemsFound', // [LevelCounter] когда найдены все предметы на уровне
  lvCounterStat: 'lvCounterStat', // посылает статистику, сколько предметов осталось найти и сколько уже найдено
  AD: {
    onRewarded: 'ad:onRewarded',
  },
  LEVEL: {
    forceNextLevel: 'level:forceNextLevel',
    dropCaught: 'level:dropCaught',
    timeExpired: 'level:timeExpired',
  },
  paymentManager: {
    hasNoAdsPass: 'paymentManager:hasNoAdsPass',
    giveReward: 'paymentManager:giveReward',
  },
  Options: {
    toggleAudioVolume: 'options:toggleAudioVolume',
    btnCredits: 'options:btnCredits',
    hide: 'options:hide',
  },
  Timer: {
    tick: 'timer:timerTick',
    end: 'timer:timerEnd',
    kill: 'timer:kill',
  },
  STORAGE: {
    // todo hintsUpdated некорректное название рудимент, так как срабатывает при любых покупках товаров
    hintsUpdated: 'storage:hintsUpdated', // срабатывает как при добавлении, так и трате хинтов todo логичнее переименовать и перенести в STORE
    levelUpdated: 'storage:levelUpdated',
  },
  UIManager: {
    closeModule: 'UIManager:closeModule',
  },
  STORE: {
    hide: 'store:hide',
  },
}

const ADAPTER_EVENTS = {
  PAUSE_EVENT: 'pause',
  RESUME_EVENT: 'resume',
  AUDIO_ON_EVENT: 'audio_on',
  AUDIO_OFF_EVENT: 'audio_off',
}

export {ADAPTER_EVENTS, GAME_EVENTS}
