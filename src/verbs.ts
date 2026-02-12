import { FetchRequest } from './fetch_request'
import type { RequestOptions } from './fetch_request'
import type { FetchResponse } from './fetch_response'

async function get (url: string | URL, options?: RequestOptions): Promise<FetchResponse> {
  const request = new FetchRequest('get', url, options)
  return request.perform()
}

async function post (url: string | URL, options?: RequestOptions): Promise<FetchResponse> {
  const request = new FetchRequest('post', url, options)
  return request.perform()
}

async function put (url: string | URL, options?: RequestOptions): Promise<FetchResponse> {
  const request = new FetchRequest('put', url, options)
  return request.perform()
}

async function patch (url: string | URL, options?: RequestOptions): Promise<FetchResponse> {
  const request = new FetchRequest('patch', url, options)
  return request.perform()
}

async function destroy (url: string | URL, options?: RequestOptions): Promise<FetchResponse> {
  const request = new FetchRequest('delete', url, options)
  return request.perform()
}

export { get, post, put, patch, destroy }
