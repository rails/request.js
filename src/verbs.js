import { Request } from "./request";

async function get (url, options) {
  const response = new Request("get", url, options)
  return response.perform()
}

async function post(url, options) {
  const response = new Request("post", url, options);
  return response.perform();
}

async function put(url, options) {
  const response = new Request("put", url, options);
  return response.perform();
}

async function patch(url, options) {
  const response = new Request("patch", url, options);
  return response.perform();
}

async function destroy(url, options) {
  const response = new Request("delete", url, options);
  return response.perform();
}

export { get, post, put, patch, destroy };
