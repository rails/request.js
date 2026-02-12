export class FetchResponse {
  readonly response: Response
  private responseText?: Promise<string>
  private responseJson?: Promise<unknown>

  constructor (response: Response) {
    this.response = response
  }

  get statusCode (): number {
    return this.response.status
  }

  get redirected (): boolean {
    return this.response.redirected
  }

  get ok (): boolean {
    return this.response.ok
  }

  get unauthenticated (): boolean {
    return this.statusCode === 401
  }

  get unprocessableEntity (): boolean {
    return this.statusCode === 422
  }

  get authenticationURL (): string | null {
    return this.response.headers.get('WWW-Authenticate')
  }

  get contentType (): string {
    const contentType = this.response.headers.get('Content-Type') || ''

    return contentType.replace(/;.*$/, '')
  }

  get headers (): Headers {
    return this.response.headers
  }

  get html (): Promise<string> {
    if (this.contentType.match(/^(application|text)\/(html|xhtml\+xml)$/)) {
      return this.text
    }

    return Promise.reject(new Error(`Expected an HTML response but got "${this.contentType}" instead`))
  }

  get json (): Promise<unknown> {
    if (this.contentType.match(/^application\/.*json$/)) {
      return this.responseJson || (this.responseJson = this.response.json())
    }

    return Promise.reject(new Error(`Expected a JSON response but got "${this.contentType}" instead`))
  }

  get text (): Promise<string> {
    return this.responseText || (this.responseText = this.response.text())
  }

  get isTurboStream (): RegExpMatchArray | null {
    return this.contentType.match(/^text\/vnd\.turbo-stream\.html/)
  }

  get isScript (): RegExpMatchArray | null {
    return this.contentType.match(/\b(?:java|ecma)script\b/)
  }

  async renderTurboStream (): Promise<void> {
    if (this.isTurboStream) {
      if (window.Turbo) {
        await window.Turbo.renderStreamMessage(await this.text)
      } else {
        console.warn('You must set `window.Turbo = Turbo` to automatically process Turbo Stream events with request.js')
      }
    } else {
      return Promise.reject(new Error(`Expected a Turbo Stream response but got "${this.contentType}" instead`))
    }
  }

  async activeScript (): Promise<void> {
    if (this.isScript) {
      const script = document.createElement('script')
      const metaTag = document.querySelector<HTMLMetaElement>('meta[name=csp-nonce]')
      if (metaTag) {
        const nonce = metaTag.nonce === '' ? metaTag.content : metaTag.nonce
        if (nonce) { script.setAttribute('nonce', nonce) }
      }
      script.innerHTML = await this.text
      document.body.appendChild(script)
    } else {
      return Promise.reject(new Error(`Expected a Script response but got "${this.contentType}" instead`))
    }
  }
}
