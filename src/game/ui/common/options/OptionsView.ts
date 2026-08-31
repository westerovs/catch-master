import {gsap} from 'gsap'
import {Container} from 'pixi.js'
import {applyInteractive} from '@/game/components/buttons/buttons.ts'
import {GAME_NAMES} from '@/game/config/constants.ts'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.ts'
import {GAME_EVENTS} from '@/game/events/gameEvents.ts'
import BaseModal from '@/game/ui/common/modal/BaseModal.ts'
import Credits from '@/game/ui/common/options/Credits.ts'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.ts'
import {destroyTimeLine} from '@/game/utils/animations/gsapUtils.ts'
import type {SpriteWithMetadata} from '@/game/utils/gameUtils/GameUtils.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

type OptionsButtonData = {
  name: string
  textureON: string
  textureOFF: string | null
  position: {x: number; y: number}
}

type AudioButton = Container & {
  audioData: Pick<OptionsButtonData, 'textureON' | 'textureOFF'>
}

type OptionsToggleButton = SpriteWithMetadata & {
  alignRight: () => void
}

const VIEW_SIZE = {
  w: 430,
  h: 400,
  buttonsGap: 74,
}
const BUTTONS_GAP = 15
const BUTTONS_DATA: Record<string, OptionsButtonData> = {
  sfxBtn: {
    name: 'sfxBtn',
    textureON: 'icon-sfx-on',
    textureOFF: 'icon-sfx-off',
    position: {
      x: -VIEW_SIZE.buttonsGap,
      y: -VIEW_SIZE.buttonsGap - BUTTONS_GAP,
    },
  },
  musicBtn: {
    name: 'musicBtn',
    textureON: 'icon-music-on',
    textureOFF: 'icon-music-off',
    position: {
      x: VIEW_SIZE.buttonsGap,
      y: -VIEW_SIZE.buttonsGap - BUTTONS_GAP,
    },
  },
  btnMainScreen: {
    name: 'btnMainScreen',
    textureON: 'icon-home',
    textureOFF: null,
    position: {
      x: 0,
      y: VIEW_SIZE.buttonsGap - BUTTONS_GAP,
    },
  },
}

const isNeedCreditsField = () => {
  const availableGames: string[] = [GAME_NAMES.detective, GAME_NAMES.detectiveGirl]
  return availableGames.includes(GAME_NAMES.currentName)
}

export default class OptionsView extends BaseModal {
  #game = Locator.game
  #optionsToggleBtn!: OptionsToggleButton

  #sfxBtn!: AudioButton
  #musicBtn!: AudioButton
  #btnMainScreen!: AudioButton
  #buttons: AudioButton[] = []
  #timeLine: ReturnType<typeof gsap.timeline> | null = null
  #credits: Credits | null = null

  constructor() {
    super({
      ...VIEW_SIZE,
      h: isNeedCreditsField() ? VIEW_SIZE.h + 70 : VIEW_SIZE.h,
      label: 'OptionsView',
      forceUpdateAdaptive: true,
    })

    this.eventMode = 'static'
    this.label = 'optionView'
    this.zIndex = 10
    this.visible = false

    this.#init()
  }

  get optionsToggleBtn() {
    return this.#optionsToggleBtn
  }

  get buttons() {
    return this.#buttons
  }

  get sfxBtn() {
    return this.#sfxBtn
  }

  get musicBtn() {
    return this.#musicBtn
  }

  get btnMainScreen() {
    return this.#btnMainScreen
  }

  async hide() {
    await this.toggleVisibility()
  }

  toggleVisibility = async () => {
    if (this.#timeLine?.isActive()) return

    const isVisible = !this.visible
    if (isVisible && !Locator.uiLayer.openModal(this)) return

    this.visible = isVisible

    if (isVisible) SdkManager.gameplayStop()
    else SdkManager.gameplayStart()

    if (!isVisible) {
      this.#game.emit(GAME_EVENTS.Options.hide)
    }

    const timeline = gsap.timeline({ease: 'linear'}).to(this.#optionsToggleBtn, {angle: isVisible ? 90 : 0, duration: 0.1})
    timeline.eventCallback('onComplete', () => {
      if (!isVisible) Locator.uiLayer.closeModal(this)
      destroyTimeLine(this.#timeLine)
    })

    this.#timeLine = timeline
    await timeline
  }

  #init = () => {
    this.#createWheel()
    this.#createButtons()
    this.#checkFlagVisibleSoundButtons()

    this.#buttons = [this.#sfxBtn, this.#musicBtn, this.#btnMainScreen]

    this.#initCredits()
  }

  #createWheel = () => {
    this.#optionsToggleBtn = GameUtils.createSprite('icon-wheel', {
      label: 'optionsToggleBtn',
      interactive: true,
    }) as OptionsToggleButton
    ButtonAnimator.initOverHandler(this.#optionsToggleBtn)

    this.#optionsToggleBtn.visible = false
    this.#optionsToggleBtn.alignRight = this.#alignWheelRight

    Locator.uiLayer.globalUiLayer.addChild(this.#optionsToggleBtn)
    this.#alignWheelRight()
  }

  #alignWheelRight = () => {
    Locator.uiLayer.alignRight(this.#optionsToggleBtn, {y: 60})
  }

  #createButtons = () => {
    this.#sfxBtn = this.#createButton(BUTTONS_DATA.sfxBtn)
    this.#musicBtn = this.#createButton(BUTTONS_DATA.musicBtn)
    this.#btnMainScreen = this.#createButton(BUTTONS_DATA.btnMainScreen)
  }

  #createButton = ({name, textureON, textureOFF, position}: OptionsButtonData) => {
    const container = new Container({label: name}) as AudioButton
    container.audioData = {
      textureON,
      textureOFF,
    }
    container.position.copyFrom(position)

    if (isNeedCreditsField()) {
      container.y -= 40
    }

    applyInteractive(container)

    const wrapper = GameUtils.createSprite('btn-ui-1')
    const icon = GameUtils.createSprite(textureON, {label: 'icon'})

    container.addChild(wrapper, icon)
    this.addChild(container)

    ButtonAnimator.initOverHandler([container])
    return container
  }

  #checkFlagVisibleSoundButtons = () => {
    if (SdkManager.flags.hideSoundButtons) {
      this.#musicBtn.visible = false
      this.#sfxBtn.visible = false
      this.#btnMainScreen.y = 0
    }
  }

  // ----------------- credits
  #initCredits = () => {
    if (!isNeedCreditsField()) return

    this.#credits = new Credits(this)
  }
}

export {VIEW_SIZE}

export type {AudioButton}
