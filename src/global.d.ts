interface TurboInstance {
  fetch: typeof fetch
  renderStreamMessage: (html: string) => Promise<void>
}

declare global {
  interface Window {
    Turbo?: TurboInstance
  }
}

export {}
