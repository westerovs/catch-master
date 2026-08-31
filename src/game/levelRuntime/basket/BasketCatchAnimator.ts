import {gsap} from 'gsap'
import type {Container} from 'pixi.js'

const BASKET_VISUAL_LABEL = 'basket-visual'
const HARMFUL_TINT = 0xff4d4d

// Класс отвечает за анимацию корзины

export default class BasketCatchAnimator {
  #view: Container
  #basketVisual: Container | null = null
  #timeline: gsap.core.Timeline | null = null

  constructor(view: Container) {
    this.#view = view
  }

  public play(isHarmful: boolean) {
    const basketVisual = this.#view.getChildByLabel(BASKET_VISUAL_LABEL, true)
    if (!basketVisual) return

    this.#timeline?.kill()
    this.#basketVisual = basketVisual
    this.#resetBasketVisual(basketVisual)
    basketVisual.tint = isHarmful ? HARMFUL_TINT : 0xffffff
    this.#timeline = isHarmful ? this.#createHarmfulTimeline(basketVisual) : this.#createRewardTimeline(basketVisual)
  }

  public destroy() {
    this.#timeline?.kill()
    if (this.#basketVisual) this.#resetBasketVisual(this.#basketVisual)
    this.#basketVisual = null
    this.#timeline = null
  }

  #createRewardTimeline(basketVisual: Container) {
    return gsap
      .timeline({onComplete: () => this.#completeAnimation(basketVisual)})
      .to(basketVisual, {y: 12, duration: 0.1, ease: 'power2.in'})
      .to(basketVisual.scale, {x: 1.16, y: 0.78, duration: 0.1, ease: 'power2.in'}, '<')
      .to(basketVisual, {y: -16, duration: 0.16, ease: 'power3.out'})
      .to(basketVisual.scale, {x: 0.9, y: 1.18, duration: 0.16, ease: 'back.out(2)'}, '<')
      .to(basketVisual, {y: 0, duration: 0.18, ease: 'bounce.out'})
      .to(basketVisual.scale, {x: 1, y: 1, duration: 0.2, ease: 'elastic.out(1, 0.35)'}, '<')
  }

  #createHarmfulTimeline(basketVisual: Container) {
    return gsap
      .timeline({onComplete: () => this.#completeAnimation(basketVisual)})
      .to(basketVisual, {y: 10, duration: 0.12, ease: 'power2.in'})
      .to(basketVisual.scale, {x: 0.62, y: 1.22, duration: 0.16, ease: 'power3.in'}, '<')
      .to(basketVisual.skew, {x: 0.12, duration: 0.07, repeat: 3, yoyo: true, ease: 'sine.inOut'})
      .to(basketVisual, {y: -28, angle: -4, duration: 0.13, ease: 'power4.out'})
      .to(basketVisual.scale, {x: 1.28, y: 0.72, duration: 0.13, ease: 'back.out(2)'}, '<')
      .to(basketVisual, {y: 0, angle: 0, duration: 0.22, ease: 'bounce.out'})
      .to(basketVisual.scale, {x: 1, y: 1, duration: 0.24, ease: 'elastic.out(1, 0.3)'}, '<')
      .to(basketVisual.skew, {x: 0, duration: 0.15}, '<')
      .to(basketVisual, {y: -25, duration: 0.14, ease: 'power3.out'})
      .to(basketVisual, {y: 0, duration: 0.22, ease: 'bounce.out'})
  }

  #completeAnimation(basketVisual: Container) {
    this.#resetBasketVisual(basketVisual)
    this.#basketVisual = null
    this.#timeline = null
  }

  #resetBasketVisual(basketVisual: Container) {
    basketVisual.y = 0
    basketVisual.angle = 0
    basketVisual.tint = 0xffffff
    basketVisual.scale.set(1)
    basketVisual.skew.set(0)
  }
}
