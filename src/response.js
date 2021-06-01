export class Response {
  constructor (response) {
    this.response = response
  }

  get statusCode () {
    return this.response.status
  }

  get ok () {
    return this.response.ok
  }

  get unauthenticated () {
    return this.statusCode === 401
  }

  get authenticationURL () {
    return this.response.headers.get('WWW-Authenticate')
  }

  get contentType () {
    const contentType = this.response.headers.get('Content-Type') || ''
    return contentType.replace(/;.*$/, '')
  }

  get headers () {
    return this.response.headers
  }

  get html () {
    if (this.contentType.match(/^(application|text)\/(html|xhtml\+xml)$/)) {
      return this.response.text()
    } else {
      return Promise.reject(new Error(`Expected an HTML response but got "${this.contentType}" instead`))
    }
  }

  get json () {
    if (this.contentType.match(/^application\/json/)) {
      return this.response.json()
    } else {
      return Promise.reject(new Error(`Expected a JSON response but got "${this.contentType}" instead`))
    }
  }

  get text () {
    return this.response.text()
  }
}
