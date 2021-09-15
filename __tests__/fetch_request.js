/**
 * @jest-environment jsdom
 */
import { FetchRequest } from '../src/fetch_request'
import { FetchResponse } from '../src/fetch_response'

test('request is performed with 200', async () => {
  const mockResponse = { status: 200, body: "success!" }
  window.fetch = jest.fn().mockResolvedValue(mockResponse)

  const testRequest = new FetchRequest("get", "localhost")
  const testResponse = await testRequest.perform()

  expect(window.fetch).toHaveBeenCalledTimes(1)
  expect(window.fetch).toHaveBeenCalledWith("localhost", testRequest.fetchOptions)
  expect(testResponse).toStrictEqual(new FetchResponse(mockResponse))
})
