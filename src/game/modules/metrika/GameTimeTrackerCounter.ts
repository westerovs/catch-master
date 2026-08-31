import YaMetrika from './YaMetrika.ts'

export default class GameTimeTrackerCounter {
  static instance: GameTimeTrackerCounter | undefined

  #interval = 1000 * 60 // 3 минуты

  constructor() {
    if (typeof GameTimeTrackerCounter.instance === 'object') {
      return GameTimeTrackerCounter.instance
    }

    this.#start()

    GameTimeTrackerCounter.instance = this
    return GameTimeTrackerCounter.instance
  }

  #start = () => {
    setInterval(this.#tick, this.#interval)
  }

  #tick = () => {
    YaMetrika.gameTimeTracker()
  }
}
