import type {Container} from 'pixi.js'

type InteractiveTarget = Container & {type?: string}

const applyInteractive = (target: InteractiveTarget, {isButton = false}: {isButton?: boolean} = {}) => {
  const props: {eventMode: 'static'; cursor: 'pointer'; type?: string} = {
    eventMode: 'static',
    cursor: 'pointer',
  }

  if (isButton) props.type = 'button'

  return Object.assign(target, props)
}

export {applyInteractive}
