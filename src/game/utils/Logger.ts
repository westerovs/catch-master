import LocalStorage from '@/game/engine/storage/LocalStorage.ts'

const COLORS = {
  default: '#44A0A3',
  warning: 'tomato',
  error: 'red',
}

export default class Logger {
  static log(message = '', args: unknown = null, color = COLORS.default) {
    if (!LocalStorage.isDebug) return

    console.log(`%c[Logger]:`, `color: ${color}`, message, args)
  }
}
