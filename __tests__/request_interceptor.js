/**
 * @jest-environment jsdom
 */
import { RequestInterceptor } from '../src/request_interceptor'
import { FetchRequest } from '../src/fetch_request'

beforeEach(() => {
  window.fetch = jest.fn().mockResolvedValue({ status: 200, body: "done" })
})

test('request intercepter is executed', async () => {
  const mockInterceptor =  jest.fn(() => {
    return Promise.resolve("hi!")
  })
  RequestInterceptor.register(mockInterceptor)
  
  const testRequest = new FetchRequest("get", "localhost")
  await testRequest.perform()

  expect(RequestInterceptor.get()).toBeDefined()
  expect(mockInterceptor).toHaveBeenCalledTimes(1)
  expect(window.fetch).toHaveBeenCalledTimes(1)
})

test('request interceptors overwrite each other', async () => {
  const mockInterceptorOne = jest.fn().mockResolvedValue()
  const mockInterceptorTwo = jest.fn().mockResolvedValue()
  RequestInterceptor.register(mockInterceptorOne)
  RequestInterceptor.register(mockInterceptorTwo)
  
  const testRequest = new FetchRequest("get", "localhost")
  await testRequest.perform()

  expect(RequestInterceptor.get()).toBeDefined()
  expect(mockInterceptorOne).toHaveBeenCalledTimes(0)
  expect(mockInterceptorTwo).toHaveBeenCalledTimes(1)
})

test('request executes even when interceptor rejects', async () => {
  console.error = jest.fn()
  const mockInterceptor = jest.fn().mockRejectedValue()
  RequestInterceptor.register(mockInterceptor)
  
  const testRequest = new FetchRequest("get", "localhost")
  await testRequest.perform()

  expect(RequestInterceptor.get()).toBeDefined()
  expect(mockInterceptor).toHaveBeenCalledTimes(1)
  expect(console.error).toHaveBeenCalledTimes(1)
  expect(window.fetch).toHaveBeenCalledTimes(1)
})

test('resetting unregisters interceptor', async () => {
  const mockInterceptor = jest.fn().mockResolvedValue()
  RequestInterceptor.register(mockInterceptor)
  expect(RequestInterceptor.get()).toBeDefined()
  RequestInterceptor.reset()
  expect(RequestInterceptor.get()).toBeUndefined()

  const testRequest = new FetchRequest("get", "localhost")
  await testRequest.perform()

  expect(mockInterceptor).toHaveBeenCalledTimes(0)
  expect(window.fetch).toHaveBeenCalledTimes(1)
})
