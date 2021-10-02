import { get, post, put, patch, destroy } from '../src/verbs'

import { FetchRequest } from '../src/fetch_request'
jest.mock('../src/fetch_request', () => ({
  // __esModule: true,
  FetchRequest: jest.fn().mockImplementation(() => {
    return {
      perform: jest.fn()
    }
  })
}))

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  FetchRequest.mockClear();
});

const mockRequestOptions = { with: "options" }

test('"get" verb correctly creates FetchRequest and performs it', () => {
  get("myurl", mockRequestOptions)
  expect(FetchRequest).toHaveBeenCalledTimes(1)
  expect(FetchRequest).toHaveBeenCalledWith('get', 'myurl', mockRequestOptions)
  expect(FetchRequest.mock.results[0].value.perform).toHaveBeenCalledTimes(1)
})

test('"post" verb correctly creates FetchRequest and performs it', () => {
  post("myurl", mockRequestOptions)
  expect(FetchRequest).toHaveBeenCalledTimes(1)
  expect(FetchRequest).toHaveBeenCalledWith('post', 'myurl', mockRequestOptions)
  expect(FetchRequest.mock.results[0].value.perform).toHaveBeenCalledTimes(1)
})

test('"put" verb correctly creates FetchRequest and performs it', () => {
  put("myurl", mockRequestOptions)
  expect(FetchRequest).toHaveBeenCalledTimes(1)
  expect(FetchRequest).toHaveBeenCalledWith('put', 'myurl', mockRequestOptions)
  expect(FetchRequest.mock.results[0].value.perform).toHaveBeenCalledTimes(1)
})

test('"patch" verb correctly creates FetchRequest and performs it', () => {
  patch("myurl", mockRequestOptions)
  expect(FetchRequest).toHaveBeenCalledTimes(1)
  expect(FetchRequest).toHaveBeenCalledWith('patch', 'myurl', mockRequestOptions)
  expect(FetchRequest.mock.results[0].value.perform).toHaveBeenCalledTimes(1)
})

test('"destroy" verb correctly creates FetchRequest and performs it', () => {
  destroy("myurl", mockRequestOptions)
  expect(FetchRequest).toHaveBeenCalledTimes(1)
  expect(FetchRequest).toHaveBeenCalledWith('delete', 'myurl', mockRequestOptions)
  expect(FetchRequest.mock.results[0].value.perform).toHaveBeenCalledTimes(1)
})
