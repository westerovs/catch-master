import {GAME_STATES} from '@/game/config/constants.ts'
import LevelConfig from '@/game/config/LevelConfig.ts'
import type SoundManager from '@/game/engine/audio/SoundManager.ts'
import Locator from '@/game/engine/Locator.ts'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import {MUSIC_PLAYER_ALIASES, MUSIC_PLAYER_PLAYLIST} from '@/game/generatedAssets/soundList.ts'

const RANDOM_MUSIC = 'random'
const LEVEL_MUSIC_VOLUME = 0.7

/*
 * Отвечает за запуск и приостановку музыки на конкретном уровне
 * */

export default class MusicManager {
  #game: Game
  #soundManager: SoundManager
  #levelMusicRequestId = 0
  #currentLevelTrack: string | null = null

  constructor(soundManager: SoundManager) {
    this.#game = Locator.game
    this.#soundManager = soundManager
  }

  // Ждёт первый клик
  init() {
    this.#setEvents()
    this.#loadStartMusic()
  }

  #setEvents = () => {
    this.#game.on(GAME_EVENTS.checkoutState, this.#play)
    this.#game.once(GAME_EVENTS.firstClick, this.#onFirstClick)
    this.#game.on(GAME_EVENTS.Options.toggleAudioVolume, (type, isMute) => {
      if (type === STORAGE_KEYS.option_isPlayMusic && !isMute) this.#play()
    })
  }

  #loadStartMusic() {
    const {START_MUSIC} = this.#soundManager.preloadAudioList
    this.#soundManager.preload(this.#soundManager.musicList, START_MUSIC)
  }

  #onFirstClick = () => {
    this.#play()
  }

  startLevelMusic = async () => {
    this.stopLevelMusic()

    const trackName = this.#getLevelTrackName()
    if (!trackName) return

    const requestId = ++this.#levelMusicRequestId
    this.#currentLevelTrack = trackName
    const isLoaded = await this.#soundManager.preloadLevelMusic(trackName)

    if (!isLoaded || requestId !== this.#levelMusicRequestId) return
    if (this.#game.stateName !== GAME_STATES.levelState) return

    this.#play()
  }

  stopLevelMusic = () => {
    this.#levelMusicRequestId++
    this.#currentLevelTrack = null
    this.#soundManager.unloadLevelMusic()
  }

  #getLevelTrackName = () => {
    const levelIndex = Locator.storage.playerData.levelIndex
    const {music: trackName} = LevelConfig.getGameLevelData(levelIndex)
    if (!trackName) {
      console.warn(`[MusicManager]: Music is not configured for level ${levelIndex}`)
      return null
    }

    if (trackName === RANDOM_MUSIC) return this.#getRandomTrackName()
    if (!MUSIC_PLAYER_PLAYLIST[trackName]) {
      console.warn(`[MusicManager]: Track not found: ${trackName}`)
      return null
    }

    return trackName
  }

  #getRandomTrackName = () => {
    const randomIndex = Math.floor(Math.random() * MUSIC_PLAYER_ALIASES.length)
    return MUSIC_PLAYER_ALIASES[randomIndex] ?? null
  }

  #play = () => {
    const stateName = this.#game.stateName
    if (!stateName) return

    const musicMap: Record<string, string | null> = {
      [GAME_STATES.gameState]: 'm_start-screen',
      [GAME_STATES.levelState]: this.#currentLevelTrack,
    }

    const musicName = musicMap[stateName]
    if (!musicName) return

    try {
      if (this.#soundManager.isPlaying(musicName)) return

      const sound = this.#soundManager.musicList[musicName]
      if (!sound) return

      const volume = stateName === GAME_STATES.levelState ? LEVEL_MUSIC_VOLUME : 1
      if (sound.state() === 'loaded' || sound.state() === 'loading') {
        this.#soundManager.play(musicName, {loop: true, volume, isMusic: true})
      } else {
        sound.on('load', () => this.#soundManager.play(musicName, {loop: true, volume, isMusic: true}))
      }
    } catch (e) {
      console.log('MusicManager play', e)
    }
  }
}
