import { FetchResponse } from './fetch_response'
import { RequestInterceptor } from './request_interceptor'
import { getCookie, compact, metaContent, stringEntriesFromFormData, mergeEntries } from './lib/utils'

export type ResponseKind = 'html' | 'json' | 'turbo-stream' | 'script'

export interface RequestOptions {
  body?: BodyInit | Record<string, unknown> | null
  contentType?: string
  query?: Record<string, string> | FormData | URLSearchParams
  responseKind?: ResponseKind | (string & {})
  signal?: AbortSignal
  headers?: Record<string, string>
  credentials?: RequestCredentials
  redirect?: RequestRedirect
  keepalive?: boolean
}

export class FetchRequest {
  method: string
  options: RequestOptions
  originalUrl: string

  constructor (method: string, url: string | URL, options: RequestOptions = {}) {
    this.method = method
    this.options = options
    this.originalUrl = url.toString()
  }

  async perform (): Promise<FetchResponse> {
    try {
      const requestInterceptor = RequestInterceptor.get()
      if (requestInterceptor) {
        await requestInterceptor(this)
      }
    } catch (error) {
      console.error(error)
    }

    const fetchFunction = window.Turbo ? window.Turbo.fetch : window.fetch
    const response = new FetchResponse(await fetchFunction(this.url, this.fetchOptions))

    if (response.unauthenticated && response.authenticationURL) {
      return Promise.reject(window.location.href = response.authenticationURL)
    }

    if (response.isScript) {
      await response.activeScript()
    }

    const responseStatusIsTurboStreamable = response.ok || response.unprocessableEntity

    if (responseStatusIsTurboStreamable && response.isTurboStream) {
      await response.renderTurboStream()
    }

    return response
  }

  addHeader (key: string, value: string): void {
    const headers = this.additionalHeaders
    headers[key] = value
    this.options.headers = headers
  }

  sameHostname (): boolean {
    if (!this.originalUrl.startsWith('http:') && !this.originalUrl.startsWith('https:')) {
      return true
    }

    try {
      return new URL(this.originalUrl).hostname === window.location.hostname
    } catch (_) {
      return true
    }
  }

  get fetchOptions (): RequestInit {
    return {
      method: this.method.toUpperCase(),
      headers: this.headers,
      body: this.formattedBody,
      signal: this.signal,
      credentials: this.credentials,
      redirect: this.redirect,
      keepalive: this.keepalive
    }
  }

  get headers (): Record<string, string> {
    const baseHeaders: Record<string, string | undefined> = {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': this.contentType,
      Accept: this.accept
    }

    if (this.sameHostname()) {
      baseHeaders['X-CSRF-Token'] = this.csrfToken
    }

    return compact(
      Object.assign(baseHeaders, this.additionalHeaders)
    )
  }

  get csrfToken (): string | undefined {
    return getCookie(metaContent('csrf-param') || '') || metaContent('csrf-token') || undefined
  }

  get contentType (): string | undefined {
    if (this.options.contentType) {
      return this.options.contentType
    } else if (this.body == null || this.body instanceof window.FormData) {
      return undefined
    } else if (this.body instanceof window.File) {
      return this.body.type
    }

    return 'application/json'
  }

  get accept (): string {
    switch (this.responseKind) {
      case 'html':
        return 'text/html, application/xhtml+xml'
      case 'turbo-stream':
        return 'text/vnd.turbo-stream.html, text/html, application/xhtml+xml'
      case 'json':
        return 'application/json, application/vnd.api+json'
      case 'script':
        return 'text/javascript, application/javascript'
      default:
        return '*/*'
    }
  }

  get body (): RequestOptions['body'] {
    return this.options.body
  }

  get query (): string {
    const originalQuery = (this.originalUrl.split('?')[1] || '').split('#')[0]
    const params = new URLSearchParams(originalQuery)

    let requestQuery: Iterable<[string, string | File]>
    if (this.options.query instanceof window.FormData) {
      requestQuery = stringEntriesFromFormData(this.options.query)
    } else if (this.options.query instanceof window.URLSearchParams) {
      requestQuery = this.options.query.entries()
    } else {
      requestQuery = Object.entries(this.options.query || {})
    }

    mergeEntries(params, requestQuery)

    const query = params.toString()
    return (query.length > 0 ? `?${query}` : '')
  }

  get url (): string {
    return (this.originalUrl.split('?')[0]).split('#')[0] + this.query
  }

  get responseKind (): string {
    return this.options.responseKind || 'html'
  }

  get signal (): AbortSignal | undefined {
    return this.options.signal
  }

  get redirect (): RequestRedirect {
    return this.options.redirect || 'follow'
  }

  get credentials (): RequestCredentials {
    return this.options.credentials || 'same-origin'
  }

  get keepalive (): boolean {
    return this.options.keepalive || false
  }

  get additionalHeaders (): Record<string, string> {
    return this.options.headers || {}
  }

  get formattedBody (): BodyInit | null | undefined {
    const bodyIsAString = Object.prototype.toString.call(this.body) === '[object String]'
    const contentTypeIsJson = this.headers['Content-Type'] === 'application/json'

    if (contentTypeIsJson && !bodyIsAString) {
      return JSON.stringify(this.body)
    }

    return this.body as BodyInit | null | undefined
  }
}
