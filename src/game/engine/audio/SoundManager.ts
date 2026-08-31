import {Howl, Howler} from 'howler'
import {ASSETS_URL} from '@/game/config/constants.ts'
import {antiMuteIOS} from '@/game/engine/audio/antiMuteIOS.ts'
import MusicManager from '@/game/engine/audio/MusicManager.ts'
import {createPreloadAudioList} from '@/game/engine/audio/preloadAudioList.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.ts'
import {ADAPTER_EVENTS, GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import {createMusicPlayerPlaylist} from '@/game/generatedAssets/soundList.ts'
import YaMetrika, {ERROR_TYPES} from '@/game/modules/metrika/YaMetrika.ts'

type SoundList = Record<string, Howl>

type AudioAsset = {
  alias: string
  src: string | string[]
}

type PlayOptions = {
  loop?: boolean
  volume?: number
  rate?: number
  isMusic?: boolean
}

type BufferedHowl = Howl & {
  _sounds?: Array<{
    _node?: {
      bufferSource?: {
        buffer?: AudioBuffer
      }
    }
  }>
}

type AudioSettingKey = typeof STORAGE_KEYS.option_isPlayMusic | typeof STORAGE_KEYS.option_isPlaySFX

export default class SoundManager {
  static instance: SoundManager

  #game: Game
  #preloadAudioList!: ReturnType<typeof createPreloadAudioList>
  #musicManager = new MusicManager(this)
  #musicVolume = 1
  #sfxVolume = 1
  #isInit = false
  #musicList: SoundList = {}
  #sfxList: SoundList = {}
  #levelMusicAliases: string[] = []

  get preloadAudioList() {
    return this.#preloadAudioList
  }

  get musicList() {
    return this.#musicList
  }

  getAudioDebugStats = () => {
    const registeredSounds = (Howler as typeof Howler & {_howls?: Howl[]})._howls ?? []
    const allSounds = [...new Set<Howl>(registeredSounds)].filter((sound) => sound.state() !== 'unloaded')
    const musicSounds = [
      ...new Set(
        Object.entries(this.#musicList)
          .filter(([alias]) => alias !== 'silence')
          .map(([, sound]) => sound as Howl),
      ),
    ].filter((sound) => sound?.state?.() !== 'unloaded')

    return {
      totalFiles: allSounds.length,
      musicFiles: musicSounds.length,
      totalDecodedBytes: this.#calcDecodedAudioBytes(allSounds),
      musicDecodedBytes: this.#calcDecodedAudioBytes(musicSounds),
    }
  }

  constructor(game: Game) {
    this.#game = game

    if (typeof SoundManager.instance === 'object') {
      return SoundManager.instance
    }

    SoundManager.instance = this
    return SoundManager.instance
  }

  #calcDecodedAudioBytes = (sounds: Howl[]) => {
    const sampleRate = Howler.ctx?.sampleRate ?? 44100
    const bytesPerFloatSample = 4
    const fallbackChannels = 2

    return sounds.reduce((totalBytes, sound) => {
      const bufferedSound = sound as BufferedHowl
      const audioBuffer = bufferedSound._sounds
        ?.map((item) => item._node?.bufferSource?.buffer)
        .find((buffer) => buffer && buffer.length > 1)

      if (audioBuffer) {
        return totalBytes + audioBuffer.length * audioBuffer.numberOfChannels * bytesPerFloatSample
      }

      const duration = Number(sound?.duration?.())
      if (!Number.isFinite(duration) || duration <= 0) return totalBytes

      return totalBytes + duration * sampleRate * fallbackChannels * bytesPerFloatSample
    }, 0)
  }

  init = () => {
    this.#mute(true)

    this.#preloadAudioList = createPreloadAudioList()
    this.#setInitVolume()
    document.addEventListener('click', this.#onFirstClick, {once: true})
  }

  clearSoundList = (soundList: SoundList) => {
    Object.entries(soundList).forEach(([key, sound]) => {
      sound.unload()
      delete soundList[key]
      // console.log('[clearSoundList] sound unload', key)
    })
  }

  // ----------------- init -----------------
  #onFirstClick = async () => {
    if (this.#isInit) return
    await this.#initAction()
    this.#setEvents()
  }

  #initAction = async () => {
    try {
      antiMuteIOS()
    } catch (err) {
      console.error('initAction', err)
    } finally {
      this.#isInit = true
      this.#musicManager.init()

      this.#game.emit(GAME_EVENTS.firstClick)
    }
  }

  #setInitVolume() {
    const {option_isPlayMusic, option_isPlaySFX} = Locator.storage.playerData
    this.#setVolume(STORAGE_KEYS.option_isPlayMusic, option_isPlayMusic)
    this.#setVolume(STORAGE_KEYS.option_isPlaySFX, option_isPlaySFX)
  }

  #setEvents = () => {
    SdkManager.adapter.on(ADAPTER_EVENTS.AUDIO_OFF_EVENT, () => {
      this.#mute(true)
    })
    SdkManager.adapter.on(ADAPTER_EVENTS.AUDIO_ON_EVENT, () => {
      // if (SdkManager.adapter.isPaused()) return // todo вернуть если будут проблемы с playgama
      this.#mute(false)
    })

    this.#game.on(GAME_EVENTS.Options.toggleAudioVolume, this.#setVolume)
  }

  // ----------------- preload todo вынести в класс PreloadSound
  startLevelMusic = () => {
    this.#musicManager.startLevelMusic()
  }

  stopLevelMusic = () => {
    this.#musicManager.stopLevelMusic()
  }

  preloadLevelMusic = async (trackAlias: string) => {
    this.unloadLevelMusic()

    const basePath = ASSETS_URL.local
    const track = createMusicPlayerPlaylist({basePath})[trackAlias]

    if (!track) {
      console.warn(`[preloadLevelMusic] Track not found: ${trackAlias}`)
      return false
    }

    const victory = {
      alias: 'm_victory',
      src: `${basePath}assets/audio/music/m_victory.mp3`,
    }

    this.#levelMusicAliases = [track.alias, victory.alias]
    this.preload(this.#musicList, [victory])
    await this.preload(this.#musicList, [track])

    return this.#musicList[trackAlias]?.state() === 'loaded'
  }

  unloadLevelMusic = () => {
    this.#levelMusicAliases.forEach((alias) => {
      const sound = this.#musicList[alias]
      sound?.stop()
      sound?.unload()
      delete this.#musicList[alias]
    })

    this.#levelMusicAliases = []
  }

  preloadSFXFMain = async () => {
    try {
      const {SFX} = this.#preloadAudioList

      await this.preload(this.#sfxList, SFX, true)
    } catch (err) {
      console.error(`[SoundManager firstLoadAndInit error]: ${err}`)
    }
  }

  preloadSFXFLevel = async () => {
    try {
      const {SFX} = this.#preloadAudioList

      await this.preload(this.#sfxList, SFX, true)
    } catch (err) {
      console.error(`[SoundManager firstLoadAndInit error]: ${err}`)
    }
  }

  preload = (array: SoundList, assets: AudioAsset[], preload = true, callBack?: () => void) => {
    const promises = assets.map((audio) => {
      return new Promise<void>((resolve) => {
        try {
          if (array[audio.alias]) {
            resolve() // Если звук уже существует, сразу разрешаем промис
            return
          }

          const src = Array.isArray(audio.src) ? audio.src : [audio.src]
          const sound = new Howl({src: src, preload})
          array[audio.alias] = sound

          // Разрешаем промис после завершения загрузки
          sound.once('load', () => {
            try {
              if (callBack) callBack()
              resolve()
            } catch (e) {
              YaMetrika.preloadError(ERROR_TYPES?.SOUND_PRELOAD?.preload, e)
              resolve()
            }
          })

          // Обработка ошибок при загрузке
          sound.once('loaderror', (id, err) => {
            // hardcode проверка для теста
            if (audio.alias === 'm_start-screen') {
              const backupUrl = ''
              const backupSrc = `${backupUrl}assets/audio/music/m_start-screen.mp3`

              const fallbackSound = new Howl({src: [backupSrc], preload})

              fallbackSound.once('load', () => {
                array[audio.alias] = fallbackSound
                if (callBack) callBack()
                this.#game.emit(GAME_EVENTS.firstClick)
                resolve()
              })

              fallbackSound.once('loaderror', (id2, err2) => {
                console.log(`[fallback] Failed to load backup for ${audio.alias}:`, err2)
                YaMetrika.soundLoadErr(audio, err2)
                resolve()
              })

              return // важно: не идём дальше после fallback
            }
            YaMetrika.soundLoadErr(audio, err)
            resolve() // Пропускаем файл и продолжаем
          })
        } catch (err) {
          console.error('[preload] Error during sound setup', err)
          YaMetrika.preloadError(ERROR_TYPES?.SOUND_PRELOAD?.preload, err)
          resolve() // Пропускаем ошибку
        }
      })
    })

    // Возвращаем промис, который разрешится, когда все звуки загрузятся
    return Promise.all(promises).catch((e) => {
      console.error('[preload] Error in Promise.all', e)
    })
  }

  /* метод мгновенно подгружает звук и воспроизводит. Используется для уникальных звуков и амбиента
   возможно стоит переделать такие звуки грузить фоном, но т.к они очень мало весят, проблемы не создают*/
  loadAndPlaySFX = (keySound: string, src: string, {loop = true, volume = 1.0}: PlayOptions = {}) => {
    if (this.#sfxList[keySound]) {
      // Если уже загружен, просто воспроизводим
      this.#playSound(this.#sfxList[keySound], {loop, volume})
      return
    }

    const sound = new Howl({src: [src], loop, volume, preload: true})
    this.#sfxList[keySound] = sound

    sound.once('load', () => {
      this.#playSound(sound, {loop, volume})
    })

    sound.once('loaderror', (id, err) => {
      console.warn(`[loadAndPlaySFX] Load error: ${keySound}`, err)
    })
  }

  // ----------------- play / stop -----------------
  async play(keySound: string, {loop = false, volume = 1.0, rate = 1}: PlayOptions = {}) {
    try {
      if (!this.#isInit) return Promise.resolve(false) // Возвращаем resolved промис, если звук не инициализирован

      const sound = this.#getSound(keySound)

      if (sound) {
        if (this.#musicList[keySound]) {
          this.#playSound(sound, {loop, volume, rate, isMusic: true})
        } else if (this.#sfxList[keySound]) {
          this.#playSound(sound, {loop, volume, rate})
        }

        // Возвращаем промис, который разрешится по завершению звука
        return new Promise<void>((resolve) => {
          sound.once('end', () => resolve())
        })
      } else {
        console.log('No found sound', keySound)
        return Promise.resolve() // Если звук не найден, возвращаем resolved промис
      }
    } catch (e) {
      console.error('[play]', e)
    }
  }

  #playSound(sound: Howl, {loop = false, volume = 1.0, rate = 1, isMusic = false}: PlayOptions) {
    if (isMusic) {
      Object.values(this.#musicList).forEach((music) => music.stop())
    }

    const finalVolume = isMusic ? volume * this.#musicVolume : volume * this.#sfxVolume

    const soundId = sound.play()

    sound.loop(loop, soundId)
    sound.volume(finalVolume, soundId)
    sound.rate(rate, soundId)
  }

  #getSound(keySound: string) {
    return this.#musicList[keySound] || this.#sfxList[keySound]
  }

  stop(keySound: string, fadeDuration = 0) {
    const sound = this.#getSound(keySound)
    if (sound) {
      if (sound.playing()) {
        sound.fade(sound.volume(), 0, fadeDuration)
        setTimeout(() => sound.stop(), fadeDuration)
      }
    }
  }

  stopAll() {
    const soundLists = [this.#musicList, this.#sfxList]

    soundLists.forEach((type) => {
      Object.values(type).forEach((sound) => {
        if (sound.playing()) sound.stop()
      })
    })
  }

  isPlaying(keySound: string) {
    const sound = this.#getSound(keySound)
    return sound ? sound.playing() : false
  }

  // ------------- mute / unmute / volume -------------
  #mute = (bool: boolean) => {
    Howler.mute(bool)
  }

  #setVolume = (type: AudioSettingKey, isMute: boolean) => {
    const volume = isMute ? 1 : 0

    if (type === STORAGE_KEYS.option_isPlayMusic) this.#musicVolume = volume
    if (type === STORAGE_KEYS.option_isPlaySFX) this.#sfxVolume = volume

    const soundMap: Record<AudioSettingKey, SoundList[]> = {
      [STORAGE_KEYS.option_isPlaySFX]: [this.#sfxList],
      [STORAGE_KEYS.option_isPlayMusic]: [this.#musicList],
    }

    const soundGroups = soundMap[type]
    if (!soundGroups) return

    soundGroups.forEach((group) => {
      Object.values(group).forEach((track) => track.volume(volume))
    })
  }
}
