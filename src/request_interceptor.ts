import type { FetchRequest } from './fetch_request'

export type Interceptor = (request: FetchRequest) => void | Promise<void>

export class RequestInterceptor {
  private static interceptor?: Interceptor

  static register (interceptor: Interceptor): void {
    this.interceptor = interceptor
  }

  static get (): Interceptor | undefined {
    return this.interceptor
  }

  static reset (): void {
    this.interceptor = undefined
  }
}
