import {Text, type TextStyleOptions} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import BaseModal from '@/game/ui/common/modal/BaseModal.ts'

export default class PurchaseError extends BaseModal {
  #message: string
  #style: TextStyleOptions = {
    ...primaryFontStyle,
    fontSize: 35,
    lineHeight: 50,
    wordWrap: true,
    wordWrapWidth: 400,
    align: 'center',
    fontFamily: 'primaryFont',
  }

  constructor(message: string) {
    super({h: 300, forceUpdateAdaptive: true})

    this.label = 'purchaseError'
    this.#message = message
    this.rect.tint = 0xa9261b
    this.#create()
  }

  #create() {
    this.zIndex = 999
    Locator.uiLayer.stateUiLayer.addChild(this)
    this.#setText()
  }

  #setText() {
    if (!this.#message) return
    const text = new Text({label: 'purchaseErrorText', text: this.#message, style: this.#style})
    text.anchor.set(0.5)
    this.addChild(text)
  }
}
