// todo подумать, мб сделать в настройках выбор темы интерфейса
const GAME_STYLES = {
  fadeHalfAlpha: 0.65,
}

const FONT_COLORS = {
  mainFont: 0xf4d884,
  secondFont: 0x373751,
  accentFont: 0x6e7f80,
  blackColor: 0x000000,
}

const primaryFontStyle = {
  fill: FONT_COLORS.blackColor,
  fontFamily: 'primaryFont',
  fontWeight: '800' as const,
  fontSize: 36,
}

const getPopupColors = () => {
  return {
    body: 0x005462,
    border: 0x8da399,
  }
}
const popupColors = getPopupColors()

const getLeaderAndStoreColors = () => {
  return {
    body: 0x2e1313,
    border: 0x8b814f,
  }
}
const leaderAndStoreColors = getLeaderAndStoreColors()

const getRewardWindowStyles = () => {
  return {
    rowTextColor: 0x5a2713,
    headerTextColor: 0x5a2713,
    headerTextOffsetY: -5,
  }
}
const rewardWindowStyles = getRewardWindowStyles()

export {FONT_COLORS, GAME_STYLES, leaderAndStoreColors, popupColors, primaryFontStyle, rewardWindowStyles}
