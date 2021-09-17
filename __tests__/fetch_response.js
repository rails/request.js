/**
 * @jest-environment jsdom
 */
import 'isomorphic-fetch'
import { FetchRequest } from '../src/fetch_request'

test('getters on 200-OK json request', async () => {
  const mockBody = { some: "json" }
  const mockResponse = new Response(JSON.stringify(mockBody), { status: 200, headers: new Headers({'Content-Type': 'application/json; charset=exotic'}) })
  window.fetch = jest.fn().mockResolvedValue(mockResponse)

  const testRequest = new FetchRequest("get", "localhost")
  let testResponse = await testRequest.perform()

  expect(testResponse.statusCode).toBe(200)
  expect(testResponse.ok).toBeTruthy()
  expect(testResponse.redirected).toBeFalsy()  
  expect(testResponse.unauthenticated).toBeFalsy()
  expect(testResponse.unprocessableEntity).toBeFalsy()
  expect(testResponse.authenticationURL).toBeNull()  
  expect(testResponse.contentType).toBe('application/json')
  expect(await testResponse.json).toStrictEqual(mockBody)
})

test('getters on 302-Found request', async () => {
  const mockResponse = new Response(null, { status: 302, url: 'https://localhost/login', headers: new Headers({'Location': 'https://localhost/login'}) })
  jest.spyOn(mockResponse, 'redirected', 'get').mockReturnValue(true)
  window.fetch = jest.fn().mockResolvedValueOnce(mockResponse)

  const testRequest = new FetchRequest("get", "localhost", { redirect: 'error' })
  const testResponse = await testRequest.perform()

  expect(testResponse.statusCode).toBe(302)
  expect(testResponse.ok).toBeFalsy()
  expect(testResponse.redirected).toBeTruthy()
  expect(testResponse.unauthenticated).toBeFalsy()
  expect(testResponse.unprocessableEntity).toBeFalsy()
  expect(testResponse.authenticationURL).toBeNull()
})

test('getters on 401-Found request', async () => {
  const mockResponse = new Response(null, { status: 401, headers: new Headers({'WWW-Authenticate': 'https://localhost/login'}) })
  window.fetch = jest.fn().mockResolvedValue(mockResponse)

  delete window.location
  window.location = new URL('https://www.example.com/')
  expect(window.location.href).toBe('https://www.example.com/')

  const testRequest = new FetchRequest("get", "localhost")
  expect(testRequest.perform()).rejects.toBe('https://localhost/login')

  testRequest.perform().catch(() => {
    expect(window.location.href).toBe('https://localhost/login')
  })

})

test('getters on 422-Found request', async () => {
  const mockResponse = new Response(null, { status: 422 })
  window.fetch = jest.fn().mockResolvedValue(mockResponse)

  const testRequest = new FetchRequest("get", "localhost")
  const testResponse = await testRequest.perform()

  expect(testResponse.statusCode).toBe(422)
  expect(testResponse.ok).toBeFalsy()
  expect(testResponse.unauthenticated).toBeFalsy()
  expect(testResponse.unprocessableEntity).toBeTruthy()
  expect(testResponse.authenticationURL).toBeNull()
})
