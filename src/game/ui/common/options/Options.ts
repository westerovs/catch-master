import {type FederatedPointerEvent, Sprite, Texture} from 'pixi.js'
import {GAME_STATES} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import type {PlayerProfile} from '@/game/engine/storage/defaultData.ts'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.ts'
import type Storage from '@/game/engine/storage/Storage.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import type Game from '@/game/Game.ts'
import type {AudioButton} from '@/game/ui/common/options/OptionsView.ts'
import OptionsView from '@/game/ui/common/options/OptionsView.ts'
import type {SpriteWithMetadata} from '@/game/utils/gameUtils/GameUtils.ts'

type AudioSettingKey = typeof STORAGE_KEYS.option_isPlayMusic | typeof STORAGE_KEYS.option_isPlaySFX

export default class Options {
  #game: Game
  #storage!: Storage
  #playerData!: PlayerProfile
  #view!: OptionsView
  #optionsToggleBtn!: SpriteWithMetadata
  #btnMainScreen!: AudioButton
  #musicBtn!: AudioButton
  #sfxBtn!: AudioButton

  constructor(game: Game) {
    this.#game = game

    // fast test
    // setTimeout(() => this.#toggleVisibility(), 500)
  }

  get view() {
    return this.#view
  }

  get optionsToggleBtn() {
    return this.#optionsToggleBtn
  }

  get isVisible() {
    return this.#view.visible
  }

  init = () => {
    this.#initVariables()
    this.#createView()

    this.#setInitParams()
    this.#setEvents()
  }

  setVisibleToggle = (isVisible: boolean) => {
    if (!this.#optionsToggleBtn) return

    this.#optionsToggleBtn.visible = isVisible
    this.#optionsToggleBtn.angle = 0

    if (isVisible === false && this.#view) {
      this.#view.visible = false
      Locator.uiLayer.closeModal(this.#view)
      this.#game.emit(GAME_EVENTS.Options.hide)
    }
  }

  #toggleVisibility = async () => {
    if (!this.#view) return
    await this.#view.toggleVisibility()
  }

  #initVariables = () => {
    this.#storage = Locator.storage
    this.#playerData = this.#storage.playerData
  }

  #createView = () => {
    this.#view = new OptionsView()

    this.#optionsToggleBtn = this.#view.optionsToggleBtn
    this.#btnMainScreen = this.#view.btnMainScreen
    this.#musicBtn = this.#view.musicBtn
    this.#sfxBtn = this.#view.sfxBtn
  }

  #setInitParams = () => {
    this.#setAudioStatus(this.#sfxBtn, STORAGE_KEYS.option_isPlaySFX)
    this.#setAudioStatus(this.#musicBtn, STORAGE_KEYS.option_isPlayMusic)
  }

  #setAudioStatus = (button: AudioButton, storageKey: AudioSettingKey) => {
    const icon = button.getChildByLabel('icon')
    if (!(icon instanceof Sprite)) {
      console.error(`[Options]: icon for button ${button.label} not found, update skipped`)
      return
    }

    const isPlay = this.#playerData[storageKey]
    const {textureON, textureOFF} = button.audioData
    const textureKey = isPlay ? textureON : textureOFF
    if (!textureKey) return

    icon.texture = Texture.from(textureKey)

    this.#game.emit(GAME_EVENTS.Options.toggleAudioVolume, storageKey, isPlay)
  }

  #setEvents = () => {
    this.#view.on('pointerup', this.#handleOptionClick)
    this.#optionsToggleBtn.on('pointerup', this.#onWheelHandler)

    this.#game.on(GAME_EVENTS.completeLevelWin, () => {
      this.#view.visible = false
      this.setVisibleToggle(false)
    })
  }

  #onWheelHandler = async () => {
    Locator.soundManager.play('sfx_btnClick')

    if (this.isVisible) await this.#toggleVisibility()
    else await this.#toggleVisibility()
  }

  #handleOptionClick = (event: FederatedPointerEvent) => {
    const target = event.target as AudioButton

    if (target.label === 'baseModalRectBody') return
    Locator.soundManager.play('sfx_btnClick')

    if (target.label === this.#btnMainScreen.label) {
      this.#toggleVisibility()

      if (this.#game.stateName === GAME_STATES.gameState) return
      if (this.#game.stateName === GAME_STATES.levelState) {
        this.#game.currentState?.checkoutState(GAME_STATES.gameState)
      }
    }

    if (target.label === this.#musicBtn.label) {
      this.#storage.gameSettings.toggleMusic()
      this.#setAudioStatus(target, STORAGE_KEYS.option_isPlayMusic)
    }
    if (target.label === this.#sfxBtn.label) {
      this.#storage.gameSettings.toggleSFX()
      this.#setAudioStatus(target, STORAGE_KEYS.option_isPlaySFX)
    }
    if (target.label === 'btnCredits') {
      this.#game.emit(GAME_EVENTS.Options.btnCredits)
    }
  }
}
