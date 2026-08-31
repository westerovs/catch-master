import {gsap} from 'gsap'
import type {Container, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

// Класс показывает визуальные эффекты поимки и приземления items.

type DropScoreAnimationOptions = {
  points: number
  scoreColor: number
  x: number
  y: number
}

export default class DropFeedbackAnimator {
  #view: Container
  #timelines = new Set<gsap.core.Timeline>()
  #texts = new Set<Text>()

  constructor(view: Container) {
    this.#view = view
  }

  public playScore({points, scoreColor, x, y}: DropScoreAnimationOptions) {
    const text = this.#createText(points, scoreColor, x, y)
    const timeline = this.#createTimeline(text)

    this.#view.addChild(text)
    this.#texts.add(text)
    this.#timelines.add(timeline)
  }

  public playLanding(entityId: string, onComplete: () => void) {
    const viewLabel = `drop-${entityId}`
    const dropView = this.#view.getChildByLabel(viewLabel)
    const dropEffect = dropView?.getChildByLabel(`${viewLabel}-effect`)

    if (!dropEffect) {
      console.error('[DropFeedbackAnimator]: drop effect view is missing')
      onComplete()
      return
    }

    const timeline = this.#createLandingTimeline(dropEffect, onComplete)
    this.#timelines.add(timeline)
  }

  public destroy() {
    this.#timelines.forEach((timeline) => timeline.kill())
    this.#texts.forEach((text) => text.destroy())
    this.#timelines.clear()
    this.#texts.clear()
  }

  #createText(points: number, scoreColor: number, x: number, y: number) {
    const prefix = points > 0 ? '+' : ''
    const text = GameUtils.createText(`${prefix}${points}`, {
      name: 'drop-score-text',
      style: {
        ...primaryFontStyle,
        fill: scoreColor,
        fontSize: 46,
        stroke: {color: 0x000000, width: 5},
        dropShadow: {color: 0x000000, alpha: 0.45, blur: 3, distance: 3},
      },
    })

    text.position.set(x, y - 25)
    text.scale.set(0.7)
    text.alpha = 0
    return text
  }

  #createTimeline(text: Text) {
    const startY = text.y
    const timeline = gsap.timeline()

    timeline
      .to(text, {alpha: 1, y: startY - 35, duration: 0.2, ease: 'power2.out'})
      .to(text.scale, {x: 1.15, y: 1.15, duration: 0.2, ease: 'back.out(2)'}, '<')
      .to(text, {alpha: 0, y: startY - 120, duration: 0.7, ease: 'power2.in'}, '+=0.15')
      .call(() => this.#removeAnimation(timeline, text))

    return timeline
  }

  #createLandingTimeline(dropEffect: Container, onComplete: () => void) {
    const timeline = gsap.timeline()
    const landingOffsetY = dropEffect.height * 0.35

    timeline
      .to(dropEffect.scale, {x: 1.45, y: 0.24, duration: 0.16, ease: 'power3.in'})
      .to(dropEffect, {y: landingOffsetY, duration: 0.16, ease: 'power3.in'}, '<')
      .to(dropEffect, {alpha: 0, duration: 0.2, ease: 'power2.out'}, '+=0.08')
      .to(dropEffect.scale, {x: 1.65, y: 0.2, duration: 0.2, ease: 'power2.out'}, '<')
      .call(() => this.#completeLandingAnimation(timeline, onComplete))

    return timeline
  }

  #removeAnimation(timeline: gsap.core.Timeline, text: Text) {
    this.#timelines.delete(timeline)
    this.#texts.delete(text)
    text.destroy()
  }

  #completeLandingAnimation(timeline: gsap.core.Timeline, onComplete: () => void) {
    this.#timelines.delete(timeline)
    onComplete()
  }
}

export type {DropScoreAnimationOptions}
