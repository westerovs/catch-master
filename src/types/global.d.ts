declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.mp3' {
  const src: string
  export default src
}

declare module '*.wav' {
  const src: string
  export default src
}

declare module '*.atlas' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly VITE_PLATFORM_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  createGame: (adapter: import('@/game/engine/SdkManager.ts').SdkAdapter, isTest: boolean) => Promise<void>
  __PIXI_DEVTOOLS__?: {app: unknown}
  webkitAudioContext?: typeof AudioContext
}

declare const ym: (...args: any[]) => void
