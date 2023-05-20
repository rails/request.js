import { FetchResponse } from './fetch_response'
import { RequestInterceptor } from './request_interceptor'
import { getCookie, compact, metaContent, stringEntriesFromFormData, mergeEntries } from './lib/utils'

export class FetchRequest {
  constructor (method, url, options = {}) {
    this.method = method
    this.options = options
    this.originalUrl = url.toString()
  }

  async perform () {
    try {
      const requestInterceptor = RequestInterceptor.get()
      if (requestInterceptor) {
        await requestInterceptor(this)
      }
    } catch (error) {
      console.error(error)
    }

    const response = new FetchResponse(await window.fetch(this.url, this.fetchOptions))

    if (response.unauthenticated && response.authenticationURL) {
      return Promise.reject(window.location.href = response.authenticationURL)
    }

    const responseStatusIsTurboStreamable = response.ok || response.unprocessableEntity

    if (responseStatusIsTurboStreamable && response.isTurboStream) {
      await response.renderTurboStream()
    }

    return response
  }

  addHeader (key, value) {
    const headers = this.additionalHeaders
    headers[key] = value
    this.options.headers = headers
  }

  sameHostname () {
    if (!this.originalUrl.startsWith('http:')) {
      return true
    }

    try {
      return new URL(this.originalUrl).hostname === window.location.hostname
    } catch (_) {
      return true
    }
  }

  get fetchOptions () {
    return {
      method: this.method.toUpperCase(),
      headers: this.headers,
      body: this.formattedBody,
      signal: this.signal,
      credentials: this.credentials,
      redirect: this.redirect
    }
  }

  get headers () {
    const baseHeaders = {
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

  get csrfToken () {
    return getCookie(metaContent('csrf-param')) || metaContent('csrf-token')
  }

  get contentType () {
    if (this.options.contentType) {
      return this.options.contentType
    } else if (this.body == null || this.body instanceof window.FormData) {
      return undefined
    } else if (this.body instanceof window.File) {
      return this.body.type
    }

    return 'application/json'
  }

  get accept () {
    switch (this.responseKind) {
      case 'html':
        return 'text/html, application/xhtml+xml'
      case 'turbo-stream':
        return 'text/vnd.turbo-stream.html, text/html, application/xhtml+xml'
      case 'json':
        return 'application/json, application/vnd.api+json'
      default:
        return '*/*'
    }
  }

  get body () {
    return this.options.body
  }

  get query () {
    const originalQuery = (this.originalUrl.split('?')[1] || '').split('#')[0]
    const params = new URLSearchParams(originalQuery)

    let requestQuery = this.options.query
    if (requestQuery instanceof window.FormData) {
      requestQuery = stringEntriesFromFormData(requestQuery)
    } else if (requestQuery instanceof window.URLSearchParams) {
      requestQuery = requestQuery.entries()
    } else {
      requestQuery = Object.entries(requestQuery || {})
    }

    mergeEntries(params, requestQuery)

    const query = params.toString()
    return (query.length > 0 ? `?${query}` : '')
  }

  get url () {
    return (this.originalUrl.split('?')[0]).split('#')[0] + this.query
  }

  get responseKind () {
    return this.options.responseKind || 'html'
  }

  get signal () {
    return this.options.signal
  }

  get redirect () {
    return this.options.redirect || 'follow'
  }

  get credentials () {
    return this.options.credentials || 'same-origin'
  }

  get additionalHeaders () {
    return this.options.headers || {}
  }

  get formattedBody () {
    const bodyIsAString = Object.prototype.toString.call(this.body) === '[object String]'
    const contentTypeIsJson = this.headers['Content-Type'] === 'application/json'

    if (contentTypeIsJson && !bodyIsAString) {
      return JSON.stringify(this.body)
    }

    return this.body
  }
}
