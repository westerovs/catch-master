const versionNull: Record<string, unknown> = {
  version: null,
  userLevel: null,
  coins: null,
  hints: null,
  hintDarts: null,
  hintCompass: null,
  hasAdPass: null,
  levelIndex: null,
  option_isPlayMusic: null,
  option_isPlaySFX: null,
  timer_StoreBtnReward: null,
  playerId: null,
  savedAt: null,
}
const versionUndefined: Record<string, unknown> = {
  version: undefined,
  userLevel: undefined,
  coins: undefined,
  hints: undefined,
  hintDarts: undefined,
  hintCompass: undefined,
  hasAdPass: undefined,
  levelIndex: undefined,
  option_isPlayMusic: undefined,
  option_isPlaySFX: undefined,
  timer_StoreBtnReward: undefined,
  playerId: undefined,
  savedAt: undefined,
}

const freshVersion2: Record<string, unknown> = {
  version: 0.0005,
  userLevel: 2035,
  hints: 777,
  hasAdPass: true,
  levelIndex: 66,
  option_isPlayMusic: false,
  option_isPlaySFX: false,
  option_isLight: false,
  option_isDebug: false,
  timer_StoreBtnReward: null,
  timer_NoHintsPupUpBtnReward: null,
  playerId: 'j+UJYGMJEgVdGO9clWRRnyOXY93+dEe9tgKORJdcG2Y=',
  savedAt: '2035-06-23T02:12:12.753Z',
}

const stringVersion: Record<string, unknown> = {
  version: '0.0005',
  userLevel: '2026',
  hints: '555',
  hasAdPass: 'true',
  levelIndex: '66',
  option_isPlayMusic: 'false',
  option_isPlaySFX: 'false',
  option_isLight: 'false',
  option_isDebug: 'false',
  timer_StoreBtnReward: 'null',
  timer_NoHintsPupUpBtnReward: 'null',
  playerId: 'j+UJYGMJEgVdGO9clWRRnyOXY93+dEe9tgKORJdcG2Y=',
  savedAt: '2026-06-23T02:15:12.753Z',
}

export const TEST_DATA = {
  serverData: [null, {...versionUndefined}],
  localData: [{...stringVersion}, {...versionNull}, {...freshVersion2}],
}
