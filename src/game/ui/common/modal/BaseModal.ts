import {gsap} from 'gsap'
import {Assets, Container, type DestroyOptions, type FederatedPointerEvent, Graphics, NineSliceSprite, Sprite, Text, Texture} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {popupColors, primaryFontStyle} from '@/game/styles.ts'
import LoadingSpinner from '@/game/ui/common/modal/LoadingSpinner.ts'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

/*
 * При создании BaseModal оно автоматически попадает в Ui слой modalLayer во время вызова show
 * */

export default class BaseModal extends Container {
  #rect!: Container
  view: BaseModal | null = this
  btnClose: Sprite | null = null

  eventMode = 'static' as const
  w = 430
  h = 500
  pivotCenter = true
  text = ''
  beginFill = popupColors.body
  borderFill = popupColors.border
  lineWidth = 10
  #padding = this.lineWidth * 2

  #crossOffset
  #isSprite
  #spriteTexture
  #nineSlice
  #forceUpdateAdaptive
  #isNeedCloseButton
  // additional features
  #isNeedHeader
  #header: Container | null = null
  #headerText: Text | null = null
  #loadingSpinner: LoadingSpinner | null = null

  constructor({
    label,
    w = 430,
    h = 500,
    crossOffset = {x: 0, y: 0},
    isSprite = false,
    spriteTexture = 'frame-main',
    nineSlice = {left: 0, top: 0, right: 0, bottom: 0},
    forceUpdateAdaptive = false,
    isNeedHeader = false,
    isNeedCloseButton = true,
    beginFill = popupColors.body,
    borderFill = popupColors.border,
  }: {
    label?: string
    w?: number
    h?: number
    crossOffset?: {x: number; y: number}
    isSprite?: boolean
    spriteTexture?: string
    nineSlice?: {left: number; top: number; right: number; bottom: number}
    forceUpdateAdaptive?: boolean
    isNeedHeader?: boolean
    isNeedCloseButton?: boolean
    beginFill?: number
    borderFill?: number
  } = {}) {
    super({label: label ?? 'baseModal'})

    this.visible = false

    this.w = w
    this.h = h
    this.#crossOffset = crossOffset
    this.#isSprite = isSprite

    this.#spriteTexture = spriteTexture
    this.#nineSlice = nineSlice
    this.#forceUpdateAdaptive = forceUpdateAdaptive
    this.#isNeedHeader = isNeedHeader
    this.#isNeedCloseButton = isNeedCloseButton
    this.beginFill = beginFill
    this.borderFill = borderFill

    this.#init()
  }

  get rect() {
    return this.#rect
  }

  get header() {
    return this.#header
  }

  get headerText() {
    return this.#headerText
  }

  get padding() {
    return this.#padding
  }

  updateAdaptive = () => {
    if (!this.#forceUpdateAdaptive) return
    Locator.uiLayer.resizeAdaptive(this)
  }

  async show() {
    if (!Locator.uiLayer.openModal(this)) return
    if (!this.view) return

    this.view.visible = true
    await gsap.fromTo(this, {alpha: 0}, {alpha: 1})
    return true
  }

  animateLoadingStart() {
    this.#loadingSpinner?.start()
  }

  animateLoadingEnd() {
    this.#loadingSpinner?.stop()
  }

  async hide() {
    if (this.destroyed) return

    Locator.soundManager.play('sfx_btnClick')
    this.#setEvents(false)
    await gsap.to(this, {alpha: 0, duration: 0.1, visible: false})

    Locator.uiLayer.closeModal(this)
    this.destroy()
  }

  destroy(_options?: DestroyOptions) {
    if (this.destroyed) return

    this.animateLoadingEnd()
    this.#setEvents(false)
    Locator.uiLayer.closeModal(this)

    this.parent?.removeChild(this)

    const destroyOptions = typeof _options === 'object' ? {..._options, children: true} : {children: true}
    super.destroy(destroyOptions)

    this.view = null
    this.btnClose = null
    this.#loadingSpinner = null
  }

  #init = async () => {
    this.#create()

    this.hitArea = {contains: () => true}
    this.#setEvents(true)

    if (this.#isNeedCloseButton) {
      if (this.btnClose) ButtonAnimator.initOverHandler([this.btnClose])
    }
  }

  #setEvents = (bool: boolean): void => {
    if (!this.view) return

    if (bool) {
      this.view.on('pointertap', this.#handleClick)
      document.addEventListener('keydown', this.#handleKeys)
      return
    }

    this.view.off('pointertap', this.#handleClick)
    document.removeEventListener('keydown', this.#handleKeys)
  }

  #handleClick = (event: FederatedPointerEvent) => {
    if (this.destroyed) return

    const isCloseButtonClick = event.target === this.btnClose
    const isOutsideClick = !this.#rect.getBounds().containsPoint(event.global.x, event.global.y)
    if (!isCloseButtonClick && !isOutsideClick) return

    this.hide()
  }

  #handleKeys = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return

    const key = event.key.toLowerCase()
    if (key === 'escape' && this.visible) void this.hide()
  }

  // ---------- view
  #create = () => {
    this.#createRectBody()
    this.#createHeader()
    this.#createBtnClose()
    this.#createLoadingSpinner()

    if (this.#forceUpdateAdaptive) this.updateAdaptive()
  }

  #createRectBody = () => {
    const {x, y, lineWidth, beginFill, borderFill} = this
    const {left, top, right, bottom} = this.#nineSlice

    const rect = this.#isSprite
      ? new NineSliceSprite({
          texture: Assets.get(this.#spriteTexture) ?? Texture.WHITE,
          leftWidth: left,
          topHeight: top,
          rightWidth: right,
          bottomHeight: bottom,
        })
      : new Graphics()

    rect.label = 'baseModalRectBody'
    rect.eventMode = 'static'

    if (this.#isSprite) {
      rect.position.set(x, y)
      rect.width = this.w + lineWidth
      rect.height = this.h + lineWidth
    } else {
      const graphics = rect as Graphics
      graphics
        .rect(x + lineWidth / 2, y + lineWidth / 2, this.w, this.h)
        .fill(beginFill)
        .stroke({width: lineWidth, color: borderFill})
    }

    if (this.pivotCenter) {
      rect.position.set(-(rect.width / 2) + x, -(rect.height / 2) + y)
    }

    this.#rect = rect

    this.addChild(rect)
  }

  #createBtnClose = () => {
    if (!this.#isNeedCloseButton) return

    const {w, h} = this
    const {x, y} = this.#crossOffset

    const btnClose = GameUtils.createSprite('btn-close', {
      name: 'btnClose',
      interactive: true,
    })
    btnClose.position.set(w / 2 - x, -(h / 2) - y)

    this.btnClose = btnClose
    this.addChild(btnClose)
  }

  #createLoadingSpinner = () => {
    this.#loadingSpinner = new LoadingSpinner()
    this.addChild(this.#loadingSpinner)
  }

  // --------- additional features
  #createHeader = () => {
    if (!this.#isNeedHeader) return

    const topPadding = 10
    const topBorderOffset = this.h / 2 + this.lineWidth / 2

    const header = new Container({label: 'baseModalHeader'})
    this.#header = header
    const sprite = GameUtils.createSprite('frame-header', {
      anchorY: 0,
      label: 'header',
    })
    header.position.set(0, -topBorderOffset + topPadding)

    this.#headerText = GameUtils.createText('...', {
      style: {...primaryFontStyle, fontSize: 50},
    })
    this.#headerText.y = sprite.height / 2

    header.addChild(sprite, this.#headerText)
    this.addChild(header)
  }
}
