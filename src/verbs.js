import { FetchRequest } from './fetch_request'

async function get (url, options) {
  const request = new FetchRequest('get', url, options)
  return request.perform()
}

async function post (url, options) {
  const request = new FetchRequest('post', url, options)
  return request.perform()
}

async function put (url, options) {
  const request = new FetchRequest('put', url, options)
  return request.perform()
}

async function patch (url, options) {
  const request = new FetchRequest('patch', url, options)
  return request.perform()
}

async function destroy (url, options) {
  const request = new FetchRequest('delete', url, options)
  return request.perform()
}

export { get, post, put, patch, destroy }
