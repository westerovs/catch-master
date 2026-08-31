import i18next from 'i18next'
import type {DestroyOptions} from 'pixi.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.ts'
import ButtonContainer from '../../../components/buttons/ButtonContainer.ts'
import Locator from '../../../engine/Locator.ts'
import SdkManager from '../../../engine/SdkManager.ts'
import {primaryFontStyle} from '../../../styles.ts'
import GameUtils from '../../../utils/gameUtils/GameUtils.ts'

export default class Authorization extends BaseModal {
  #game = Locator.game
  #btnEnter!: ButtonContainer

  constructor() {
    super({h: 350, forceUpdateAdaptive: true})

    this.label = 'authorizationView'

    this.#init()
  }

  #init = () => {
    this.#createTexts()
    this.#createBtnEnter()

    Locator.uiLayer.stateUiLayer.addChild(this)
  }

  destroy(_options?: DestroyOptions) {
    super.destroy(_options)
    this.#btnEnter.off('pointerdown', this.#btnEnterAction)
  }

  #createTexts = () => {
    const style = {
      ...primaryFontStyle,
      fontSize: 22,
    }

    const header = GameUtils.createText(`${i18next.t('authorizationHeader')}`, {style: {...style, fontSize: 36}})
    header.y = -120

    const p1 = GameUtils.createText(`${i18next.t('authorizationText1')}`, {anchorX: 0, style})
    p1.position.set(-this.rect.width / 2 + 25, -40)

    const p2 = GameUtils.createText(`${i18next.t('authorizationText2')}`, {anchorX: 0, style})
    p2.position.set(-this.rect.width / 2 + 25, 0)

    this.addChild(header, p1, p2)
  }

  #createBtnEnter = () => {
    this.#btnEnter = new ButtonContainer({
      props: {name: 'btnEnter', x: 0, y: 100},
      initScale: 0.65,
      spriteKeys: ['btn-primary'],
    })
    this.#btnEnter.addCenterText({
      text: `${i18next.t('authorizationBtn')}`,
    })

    this.addChild(this.#btnEnter)
    this.#btnEnter.on('pointerdown', this.#btnEnterAction)
  }

  #btnEnterAction = async () => {
    SdkManager.player
      .auth()
      .then(() => {
        console.log('[Authorization] The player is successfully logged in, page reload!')
        location.reload()
      })
      .catch((err: unknown) => {
        console.error('[Authorization] The player is not logged in!.', err)
        GameUtils.showError(err, {message: `${i18next.t('errors.type1')}`})
      })
  }
}
