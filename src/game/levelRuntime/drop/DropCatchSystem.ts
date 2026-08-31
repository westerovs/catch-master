import MathTools from '@/game/utils/MathTools.ts'
import BasketComponent from '../basket/BasketComponent.ts'
import EntityManager from '../core/EntityManager.ts'
import System from '../core/System.ts'
import PositionComponent from '../mechanics/movement/PositionComponent.ts'
import DropComponent from './DropComponent.ts'

// Система удаляет items, пересёкшие зону ловли корзины.

type DropCaughtData = {
  points: number
  scoreColor: number
  x: number
  y: number
}

export default class DropCatchSystem extends System {
  #onDropCaught: (data: DropCaughtData) => void

  constructor(entityManager: EntityManager, onDropCaught: (data: DropCaughtData) => void) {
    super(entityManager)
    this.#onDropCaught = onDropCaught
  }

  public update(deltaMS: number) {
    void deltaMS

    const basketEntity = this.query(BasketComponent, PositionComponent)[0]
    const basket = basketEntity?.getComponent(BasketComponent)
    const basketPosition = basketEntity?.getComponent(PositionComponent)
    if (!basket || !basketPosition) return

    this.#catchDrops(basket, basketPosition)
  }

  #catchDrops(basket: BasketComponent, basketPosition: PositionComponent) {
    this.query(DropComponent, PositionComponent).forEach((entity) => {
      const drop = entity.getComponent(DropComponent)
      const dropPosition = entity.getComponent(PositionComponent)
      if (!drop || !dropPosition) return
      if (!this.#isCaught(drop, dropPosition, basket, basketPosition)) return

      this.entityManager.removeEntity(entity.id)
      this.#onDropCaught({
        points: drop.points,
        scoreColor: drop.scoreColor,
        x: dropPosition.x,
        y: dropPosition.y,
      })
    })
  }

  #isCaught(drop: DropComponent, dropPosition: PositionComponent, basket: BasketComponent, basketPosition: PositionComponent) {
    const dropBounds = {
      x: dropPosition.x - drop.collisionWidth / 2,
      y: dropPosition.y - drop.collisionHeight / 2,
      width: drop.collisionWidth,
      height: drop.collisionHeight,
    }

    const basketBounds = {
      x: basketPosition.x - basket.catchWidth / 2,
      y: basketPosition.y - basket.catchHeight,
      width: basket.catchWidth,
      height: basket.catchHeight,
    }

    return MathTools.intersectsAABB(dropBounds, basketBounds)
  }
}

export type {DropCaughtData}
