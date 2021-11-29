/**
 * @jest-environment jsdom
 */
import 'isomorphic-fetch'
import { FetchResponse } from '../src/fetch_response'

test('default contentType', async () => {
  const mockResponse = new Response(null, { status: 200 })
  const testResponse = new FetchResponse(mockResponse)

  expect(testResponse.contentType).toEqual("")
})

describe('body accessors', () => {
  describe('text', () => {
    test('works multiple times', async () => {
      const mockResponse = new Response("Mock", { status: 200, headers: new Headers({'Content-Type': 'text/plain'}) })
      const testResponse = new FetchResponse(mockResponse)
    
      expect(await testResponse.text).toBe("Mock")
      expect(await testResponse.text).toBe("Mock")  
    })
    test('work regardless of content-type', async () => {
      const mockResponse = new Response("Mock", { status: 200, headers: new Headers({'Content-Type': 'not/text'}) })
      const testResponse = new FetchResponse(mockResponse)
    
      expect(await testResponse.text).toBe("Mock")  
    })
  })
  describe('html', () => {
    test('works multiple times', async () => {
      const mockResponse = new Response("<h1>hi</h1>", { status: 200, headers: new Headers({'Content-Type': 'application/html'}) })
      const testResponse = new FetchResponse(mockResponse)
    
      expect(await testResponse.html).toBe("<h1>hi</h1>")
      expect(await testResponse.html).toBe("<h1>hi</h1>")  
    })
    test('rejects on invalid content-type', async () => {
      const mockResponse = new Response("<h1>hi</h1>", { status: 200, headers: new Headers({'Content-Type': 'text/plain'}) })
      const testResponse = new FetchResponse(mockResponse)
    
      expect(testResponse.html).rejects.toBeInstanceOf(Error)
    })
  })
  describe('json', () => {
    test('works multiple times', async () => {
      const mockResponse = new Response(JSON.stringify({ json: 'body' }), { status: 200, headers: new Headers({'Content-Type': 'application/json'}) })
      const testResponse = new FetchResponse(mockResponse)
    
      // works mutliple times
      expect({ json: 'body' }).toStrictEqual(await testResponse.json)
      expect({ json: 'body' }).toStrictEqual(await testResponse.json)
    })
    test('rejects on invalid content-type', async () => {
      const mockResponse = new Response("<h1>hi</h1>", { status: 200, headers: new Headers({'Content-Type': 'text/json'}) })
      const testResponse = new FetchResponse(mockResponse)
    
      expect(testResponse.json).rejects.toBeInstanceOf(Error)
    })
  })
  describe('application/vnd.api+json', () => {
    test('works multiple times', async () => {
      const mockResponse = new Response(JSON.stringify({ json: 'body' }), { status: 200, headers: new Headers({'Content-Type': 'application/vnd.api+json'}) })
      const testResponse = new FetchResponse(mockResponse)

      expect({ json: 'body' }).toStrictEqual(await testResponse.json)
      expect({ json: 'body' }).toStrictEqual(await testResponse.json)
    })
    test('rejects on invalid content-type', async () => {
      const mockResponse = new Response("<h1>hi</h1>", { status: 200, headers: new Headers({'Content-Type': 'application/plain'}) })
      const testResponse = new FetchResponse(mockResponse)

      expect(testResponse.json).rejects.toBeInstanceOf(Error)
    })
  })
  describe('turbostream', () => {
    const mockTurboStreamMessage = `
      <turbo-stream action="append" target="mock_collection"><template>
        <div id="mock_1">message</div>
      </template></turbo-stream>`

    test('warns if Turbo is not registered', async () => {
      const mockResponse = new Response(mockTurboStreamMessage, { status: 200, headers: new Headers({'Content-Type': 'text/vnd.turbo-stream.html'}) })
      const testResponse = new FetchResponse(mockResponse)
      const warningSpy = jest.spyOn(console, 'warn').mockImplementation()

      await testResponse.renderTurboStream()
      
      expect(warningSpy).toBeCalled()
    })
    test('calls turbo', async () => {
      const mockResponse = new Response(mockTurboStreamMessage, { status: 200, headers: new Headers({'Content-Type': 'text/vnd.turbo-stream.html'}) })
      const testResponse = new FetchResponse(mockResponse)
      window.Turbo = { renderStreamMessage: jest.fn() }

      await testResponse.renderTurboStream()
      expect(window.Turbo.renderStreamMessage).toHaveBeenCalledTimes(1)
    })
    test('rejects on invalid content-type', async () => {
      const mockResponse = new Response("<h1>hi</h1>", { status: 200, headers: new Headers({'Content-Type': 'text/plain'}) })
      const testResponse = new FetchResponse(mockResponse)
    
      expect(testResponse.renderTurboStream()).rejects.toBeInstanceOf(Error)
    })
  })
})

describe('fetch response helpers', () => {
  test('forwards headers correctly', () => {
    const mockHeaders = new Headers({'Content-Type': 'text/plain'})
    const mockResponse = new Response(null, { status: 200, headers: mockHeaders })
    const testResponse = new FetchResponse(mockResponse)

    expect(testResponse.headers).toStrictEqual(mockHeaders)
  })
  test('content-type access the headers correctly', () => {
    const mockHeaders = new Headers({'Content-Type': 'text/plain'})
    const mockResponse = new Response(null, { status: 200, headers: mockHeaders })
    const testResponse = new FetchResponse(mockResponse)

    expect(testResponse.contentType).toBe('text/plain')
  })
  test('content-type cuts after semicolon', () => {
    const mockHeaders = new Headers({'Content-Type': 'application/json; charset=exotic'})
    const mockResponse = new Response(null, { status: 200, headers: mockHeaders })
    const testResponse = new FetchResponse(mockResponse)

    expect(testResponse.contentType).toBe('application/json')
  })
  test('www-authentication header is accessed', () => {
    const mockResponse = new Response(null, { status: 401, headers: new Headers({'WWW-Authenticate': 'https://localhost/login'}) })
    const testResponse = new FetchResponse(mockResponse)

    expect(testResponse.authenticationURL).toBe('https://localhost/login')
  })
})
describe('http-status helpers', () => {
  
  test('200', () => {
    const mockResponse = new Response(null, { status: 200 })
    const testResponse = new FetchResponse(mockResponse)
  
    expect(testResponse.statusCode).toBe(200)
    expect(testResponse.ok).toBeTruthy()
    expect(testResponse.redirected).toBeFalsy()  
    expect(testResponse.unauthenticated).toBeFalsy()
    expect(testResponse.unprocessableEntity).toBeFalsy()
  })
  
  test('401', () => {
    const mockResponse = new Response(null, { status: 401 })
    const testResponse = new FetchResponse(mockResponse)
  
    expect(testResponse.statusCode).toBe(401)
    expect(testResponse.ok).toBeFalsy()
    expect(testResponse.redirected).toBeFalsy()  
    expect(testResponse.unauthenticated).toBeTruthy()
    expect(testResponse.unprocessableEntity).toBeFalsy()
  })
  
  test('422', () => {
    const mockResponse = new Response(null, { status: 422 })
    const testResponse = new FetchResponse(mockResponse)
  
    expect(testResponse.statusCode).toBe(422)
    expect(testResponse.ok).toBeFalsy()
    expect(testResponse.redirected).toBeFalsy()  
    expect(testResponse.unauthenticated).toBeFalsy()
    expect(testResponse.unprocessableEntity).toBeTruthy()
  })
  
  test('302', () => {
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
})
