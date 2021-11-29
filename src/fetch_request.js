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

    if (response.ok && response.isTurboStream) {
      await response.renderTurboStream()
    }

    return response
  }

  addHeader (key, value) {
    const headers = this.additionalHeaders
    headers[key] = value
    this.options.headers = headers
  }

  get fetchOptions () {
    return {
      method: this.method.toUpperCase(),
      headers: this.headers,
      body: this.formattedBody,
      signal: this.signal,
      credentials: 'same-origin',
      redirect: this.redirect
    }
  }

  get headers () {
    return compact(
      Object.assign({
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': this.csrfToken,
        'Content-Type': this.contentType,
        Accept: this.accept
      },
      this.additionalHeaders)
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
