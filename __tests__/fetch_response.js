/**
 * @jest-environment jsdom
 */
import 'isomorphic-fetch'
import { FetchRequest } from '../src/fetch_request'
import { FetchResponse } from '../src/fetch_response'

test('default contentType', async () => {
  const mockResponse = new Response(null, { status: 200 })
  const testResponse = new FetchResponse(mockResponse)

  expect(testResponse.contentType).toEqual("")
})

test('html getter retrieves response', async () => {
  const mockResponse = new Response("<h1>hi</h1>", { status: 200, headers: new Headers({'Content-Type': 'application/html'}) })
  const testResponse = new FetchResponse(mockResponse)

  expect(testResponse.html).rejects.toBeInstanceOf(Error)
})

test('rejects body-getters with wrong contentType', async () => {
  const mockResponse = new Response(JSON.stringify({ hello: 'you' }), { status: 200, headers: new Headers({'Content-Type': 'text/plain'}) })
  const testResponse = new FetchResponse(mockResponse)

  expect(testResponse.html).rejects.toBeInstanceOf(Error)
  expect(testResponse.json).rejects.toBeInstanceOf(Error)
  expect(testResponse.renderTurboStream()).rejects.toBeInstanceOf(Error)
})

test('json can be retrieved multiple times', async () => {
  const originalBody = { hello: 'you' } 
  const mockResponse = new Response(JSON.stringify(originalBody), { status: 200, headers: new Headers({'Content-Type': 'application/json'}) })
  const testResponse = new FetchResponse(mockResponse)

  const firstInvokation = await testResponse.json
  const secondInvokation = await testResponse.json
  expect(originalBody).toStrictEqual(firstInvokation)
  expect(firstInvokation).toStrictEqual(secondInvokation)
})

test('getters on 200-OK json request', async () => {
  const mockBody = { some: "json" }
  const mockHeaders = new Headers({'Content-Type': 'application/json; charset=exotic'})
  const mockResponse = new Response(JSON.stringify(mockBody), { status: 200, headers: mockHeaders })
  const testResponse = new FetchResponse(mockResponse)

  expect(testResponse.statusCode).toBe(200)
  expect(testResponse.ok).toBeTruthy()
  expect(testResponse.redirected).toBeFalsy()  
  expect(testResponse.unauthenticated).toBeFalsy()
  expect(testResponse.unprocessableEntity).toBeFalsy()
  expect(testResponse.authenticationURL).toBeNull()  
  expect(testResponse.contentType).toBe('application/json')
  expect(testResponse.headers).toStrictEqual(mockHeaders)
  expect(await testResponse.json).toStrictEqual(mockBody)
})

test('getters on 302-Found request', async () => {
  const mockHeaders = new Headers({'Location': 'https://localhost/login'})
  const mockResponse = new Response(null, { status: 302, url: 'https://localhost/login', headers: mockHeaders })
  jest.spyOn(mockResponse, 'redirected', 'get').mockReturnValue(true)
  const testResponse = new FetchResponse(mockResponse)

  expect(testResponse.statusCode).toBe(302)
  expect(testResponse.ok).toBeFalsy()
  expect(testResponse.redirected).toBeTruthy()
  expect(testResponse.unauthenticated).toBeFalsy()
  expect(testResponse.unprocessableEntity).toBeFalsy()
  expect(testResponse.authenticationURL).toBeNull()
})

test('getters on 401-Found request', async () => {
  const mockResponse = new Response(null, { status: 401, headers: new Headers({'WWW-Authenticate': 'https://localhost/login'}) })
  const testResponse = new FetchResponse(mockResponse)

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
  const testResponse = new FetchResponse(mockResponse)

  expect(testResponse.statusCode).toBe(422)
  expect(testResponse.ok).toBeFalsy()
  expect(testResponse.unauthenticated).toBeFalsy()
  expect(testResponse.unprocessableEntity).toBeTruthy()
  expect(testResponse.authenticationURL).toBeNull()
})
