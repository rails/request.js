import { FetchRequest } from './fetchRequest'

async function get (url, options) {
  const response = new FetchRequest('get', url, options)
  return response.perform()
}

async function post (url, options) {
  const response = new FetchRequest('post', url, options)
  return response.perform()
}

async function put (url, options) {
  const response = new FetchRequest('put', url, options)
  return response.perform()
}

async function patch (url, options) {
  const response = new FetchRequest('patch', url, options)
  return response.perform()
}

async function destroy (url, options) {
  const response = new FetchRequest('delete', url, options)
  return response.perform()
}

export { get, post, put, patch, destroy }
