import {gsap} from 'gsap'
import {ASSETS_URL} from '@/game/config/constants.ts'
import Locator from '../../../../engine/Locator.ts'
import type Level from '../../Level.ts'

export default class StateIntro {
  #level: Level

  constructor(level: Level) {
    this.#level = level
  }

  execute = async () => {
    this.#tryPlayAmbient()
    await this.#createStartLevelAnimation()
  }

  // -------------------- STATE INTRO
  #createStartLevelAnimation = async () => {
    Locator.options.setVisibleToggle(true)

    const {globalUiLayer, stateUiLayer} = Locator.uiLayer

    await gsap.timeline().set(stateUiLayer, {visible: true}).fromTo([globalUiLayer, stateUiLayer], {alpha: 0}, {alpha: 1})

    Locator.options.view.optionsToggleBtn.eventMode = 'static'
  }

  #tryPlayAmbient = () => {
    const {amb} = this.#level.levelConfig
    if (!amb) return

    const basePath = ASSETS_URL.local
    const src = `${basePath}assets/audio/ambience/${amb}.mp3`
    Locator.soundManager.loadAndPlaySFX(amb, src, {loop: true})
  }
}
