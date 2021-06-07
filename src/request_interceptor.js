export class RequestInterceptor {
  static register (interceptor) {
    this.interceptor = interceptor
  }

  static get () {
    return this.interceptor
  }

  static reset () {
    this.interceptor = undefined
  }
}
