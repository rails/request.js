/**
 * @jest-environment jsdom
 */
import 'isomorphic-fetch'
import { FetchRequest } from '../src/fetch_request'
import { FetchResponse } from '../src/fetch_response'

jest.mock('../src/lib/utils', () => {
  const originalModule = jest.requireActual('../src/lib/utils')
  return {
    __esModule: true,
    ...originalModule,
    getCookie: jest.fn().mockReturnValue('mock-csrf-token'),
    metaContent: jest.fn()
  }
})

describe('perform', () => {
  test('request is performed with 200', async () => {
    const mockResponse = new Response("success!", { status: 200 })
    window.fetch = jest.fn().mockResolvedValue(mockResponse)

    const testRequest = new FetchRequest("get", "localhost")
    const testResponse = await testRequest.perform()

    expect(window.fetch).toHaveBeenCalledTimes(1)
    expect(window.fetch).toHaveBeenCalledWith("localhost", testRequest.fetchOptions)
    expect(testResponse).toStrictEqual(new FetchResponse(mockResponse))
  })

  test('request is performed with 401', async () => {
    const mockResponse = new Response(undefined, { status: 401, headers: {'WWW-Authenticate': 'https://localhost/login'}})
    window.fetch = jest.fn().mockResolvedValue(mockResponse)

    delete window.location
    window.location = new URL('https://www.example.com')
    expect(window.location.href).toBe('https://www.example.com/')

    const testRequest = new FetchRequest("get", "https://localhost")
    expect(testRequest.perform()).rejects.toBe('https://localhost/login')

    testRequest.perform().catch(() => {
      expect(window.location.href).toBe('https://localhost/login')
    })
  })

  test('turbo stream request automatically calls renderTurboStream when status is ok', async () => {
    const mockResponse = new Response('', { status: 200, headers: { 'Content-Type': 'text/vnd.turbo-stream.html' }})
    window.fetch = jest.fn().mockResolvedValue(mockResponse)
    jest.spyOn(FetchResponse.prototype, "ok", "get").mockReturnValue(true)
    jest.spyOn(FetchResponse.prototype, "isTurboStream", "get").mockReturnValue(true)
    const renderSpy = jest.spyOn(FetchResponse.prototype, "renderTurboStream").mockImplementation()

    const testRequest = new FetchRequest("get", "localhost")
    await testRequest.perform()

    expect(renderSpy).toHaveBeenCalledTimes(1)
    jest.clearAllMocks();
  })

  test('turbo stream request automatically calls renderTurboStream when status is unprocessable entity', async () => {
    const mockResponse = new Response('', { status: 422, headers: { 'Content-Type': 'text/vnd.turbo-stream.html' }})
    window.fetch = jest.fn().mockResolvedValue(mockResponse)
    jest.spyOn(FetchResponse.prototype, "ok", "get").mockReturnValue(true)
    jest.spyOn(FetchResponse.prototype, "isTurboStream", "get").mockReturnValue(true)
    const renderSpy = jest.spyOn(FetchResponse.prototype, "renderTurboStream").mockImplementation()

    const testRequest = new FetchRequest("get", "localhost")
    await testRequest.perform()

    expect(renderSpy).toHaveBeenCalledTimes(1)
    jest.clearAllMocks();
  })
})

test('treat method name case-insensitive', async () => {
  const methodNames = [ "gEt", "GeT", "get", "GET"]
  for (const methodName of methodNames) {
    const testRequest = new FetchRequest(methodName, "localhost")
    expect(testRequest.fetchOptions.method).toBe("GET")
  }
})

test('casts URL to String', async () => {
  const testRequest = new FetchRequest("GET", new URL("http://localhost"))
  expect(typeof testRequest.originalUrl).toBe("string")
})

describe('header handling', () => {
  const defaultHeaders = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': 'mock-csrf-token',
    'Accept': 'text/html, application/xhtml+xml'
  }
  describe('responseKind', () => {
    test('none', async () => {
      const defaultRequest = new FetchRequest("get", "localhost")
      expect(defaultRequest.fetchOptions.headers)
        .toStrictEqual(defaultHeaders)
    })
    test('html', async () => {
      const htmlRequest = new FetchRequest("get", "localhost", { responseKind: 'html' })
      expect(htmlRequest.fetchOptions.headers)
        .toStrictEqual(defaultHeaders)
    })
    test('json', async () => {
      const jsonRequest = new FetchRequest("get", "localhost", { responseKind: 'json' })
      expect(jsonRequest.fetchOptions.headers)
        .toStrictEqual({...defaultHeaders, 'Accept' : 'application/json, application/vnd.api+json'})
    })
    test('turbo-stream', async () => {
      const turboRequest = new FetchRequest("get", "localhost", { responseKind: 'turbo-stream' })
      expect(turboRequest.fetchOptions.headers)
        .toStrictEqual({...defaultHeaders, 'Accept' : 'text/vnd.turbo-stream.html, text/html, application/xhtml+xml'})
    })
    test('invalid', async () => {
      const invalidResponseKindRequest = new FetchRequest("get", "localhost", { responseKind: 'exotic' })
      expect(invalidResponseKindRequest.fetchOptions.headers)
        .toStrictEqual({...defaultHeaders, 'Accept' : '*/*'})
    })
  })

  describe('contentType', () => {
    test('is added to headers', () => {
      const customRequest = new FetchRequest("get", "localhost/test.json", { contentType: 'any/thing' })
      expect(customRequest.fetchOptions.headers)
        .toStrictEqual({ ...defaultHeaders, "Content-Type": 'any/thing'})
    })
    test('is not set by formData', () => {
      const formData = new FormData()
      formData.append("this", "value")
      const formDataRequest = new FetchRequest("get", "localhost", { body: formData })
      expect(formDataRequest.fetchOptions.headers)
        .toStrictEqual(defaultHeaders)
    })
    test('is set by file body', () => {
      const file = new File(["contenxt"], "file.txt", { type: "text/plain" })
      const fileRequest = new FetchRequest("get", "localhost", { body: file })
      expect(fileRequest.fetchOptions.headers)
        .toStrictEqual({ ...defaultHeaders, "Content-Type": "text/plain"})
    })
    test('is set by json body', () => {
      const jsonRequest = new FetchRequest("get", "localhost", { body: { some: "json"} })
      expect(jsonRequest.fetchOptions.headers)
        .toStrictEqual({ ...defaultHeaders, "Content-Type": "application/json"})
    })
  })

  test('additional headers are appended', () => {
    const request = new FetchRequest("get", "localhost", { contentType: "application/json", headers: { custom: "Header" } })
    expect(request.fetchOptions.headers)
      .toStrictEqual({ ...defaultHeaders, custom: "Header", "Content-Type": "application/json"})
    request.addHeader("test", "header")
    expect(request.fetchOptions.headers)
      .toStrictEqual({ ...defaultHeaders, custom: "Header", "Content-Type": "application/json", "test": "header"})
  })

  test('headers win over contentType', () => {
    const request = new FetchRequest("get", "localhost", { contentType: "application/json", headers: { "Content-Type": "this/overwrites" } })
    expect(request.fetchOptions.headers)
      .toStrictEqual({ ...defaultHeaders, "Content-Type": "this/overwrites"})
  })

  test('serializes JSON to String', () => {
    const jsonBody = { some: "json" }
    let request
    request = new FetchRequest("get", "localhost", { body: jsonBody, contentType: "application/json" })
    expect(request.fetchOptions.body).toBe(JSON.stringify(jsonBody))

    request = new FetchRequest("get", "localhost", { body: jsonBody })
    expect(request.fetchOptions.body).toBe(JSON.stringify(jsonBody))
  })

  test('not serializes JSON with explicit different contentType', () => {
    const jsonBody = { some: "json" }
    const request = new FetchRequest("get", "localhost", { body: jsonBody, contentType: "not/json" })
    expect(request.fetchOptions.body).toBe(jsonBody)
  })

  test('set redirect', () => {
    let request
    const redirectTypes = [ "follow", "error", "manual" ]
    for (const redirect of redirectTypes) {
      request = new FetchRequest("get", "localhost", { redirect })
      expect(request.fetchOptions.redirect).toBe(redirect)
    }

    request = new FetchRequest("get", "localhost")
    expect(request.fetchOptions.redirect).toBe("follow")
  })

  test('sets signal', () => {
    let request
    request = new FetchRequest("get", "localhost")
    expect(request.fetchOptions.signal).toBe(undefined)

    request = new FetchRequest("get", "localhost", { signal: "signal"})
    expect(request.fetchOptions.signal).toBe("signal")
  })

  test('has credentials setting which can be changed', () => {
    let request
    request = new FetchRequest("get", "localhost")
    expect(request.fetchOptions.credentials).toBe('same-origin')

    request = new FetchRequest("get", "localhost", { credentials: "include"})
    expect(request.fetchOptions.credentials).toBe('include')
  })

  describe('csrf token inclusion', () => {
    // window.location.hostname is "localhost" in the test suite
    test('csrf token is not included in headers if url hostname is not the same as window.location', () => {
      const request = new FetchRequest("get", "http://removeservice.com/test.json")
      expect(request.fetchOptions.headers).not.toHaveProperty("X-CSRF-Token")
    })

    test('csrf token is included in headers if url hostname is the same as window.location', () => {
      const request = new FetchRequest("get", "http://localhost/test.json")
      expect(request.fetchOptions.headers).toHaveProperty("X-CSRF-Token")
    })

    test('csrf token is included if url is a realative path', async () => {
      const defaultRequest = new FetchRequest("get", "/somepath")
      expect(defaultRequest.fetchOptions.headers).toHaveProperty("X-CSRF-Token")
    })

    test('csrf token is included if url is not parseable', async () => {
      const defaultRequest = new FetchRequest("get", "not-a-url")
      expect(defaultRequest.fetchOptions.headers).toHaveProperty("X-CSRF-Token")
    })
  })
})

describe('query params are parsed', () => {
  test('anchors are rejected', () => {
    const mixedRequest = new FetchRequest("post", "localhost/test?a=1&b=2#anchor", { query: { c: 3 } })
    expect(mixedRequest.url).toBe("localhost/test?a=1&b=2&c=3")

    const queryRequest = new FetchRequest("post", "localhost/test?a=1&b=2&c=3#anchor")
    expect(queryRequest.url).toBe("localhost/test?a=1&b=2&c=3")

    const optionsRequest = new FetchRequest("post", "localhost/test#anchor", { query: { a: 1, b: 2, c: 3 } })
    expect(optionsRequest.url).toBe("localhost/test?a=1&b=2&c=3")
  })
  test('url and options are merged', () => {
    const urlAndOptionRequest = new FetchRequest("post", "localhost/test?a=1&b=2", { query: { c: 3 } })
    expect(urlAndOptionRequest.url).toBe("localhost/test?a=1&b=2&c=3")
  })
  test('only url', () => {
    const urlRequest = new FetchRequest("post", "localhost/test?a=1&b=2")
    expect(urlRequest.url).toBe("localhost/test?a=1&b=2")
  })
  test('only options', () => {
    const optionRequest = new FetchRequest("post", "localhost/test", { query: { c: 3 } })
    expect(optionRequest.url).toBe("localhost/test?c=3")
  })
  test('options accept formData', () => {
    const formData = new FormData()
    formData.append("a", 1)

    const urlAndOptionRequest = new FetchRequest("post", "localhost/test", { query: formData })
    expect(urlAndOptionRequest.url).toBe("localhost/test?a=1")
  })
  test('options accept urlSearchParams', () => {
    const urlSearchParams = new URLSearchParams()
    urlSearchParams.append("a", 1)

    const urlAndOptionRequest = new FetchRequest("post", "localhost/test", { query: urlSearchParams })
    expect(urlAndOptionRequest.url).toBe("localhost/test?a=1")
  })
  test('urlSearchParams with list entries', () => {
    const urlSearchParams = new URLSearchParams()
    urlSearchParams.append("a[]", 1)
    urlSearchParams.append("a[]", 2)

    const urlAndOptionRequest = new FetchRequest("post", "localhost/test", {query: urlSearchParams})
    expect(urlAndOptionRequest.url).toBe("localhost/test?a%5B%5D=1&a%5B%5D=2")
  });
  test('handles empty query', () => {
    const emptyQueryRequest = new FetchRequest("get", "localhost/test")
    expect(emptyQueryRequest.url).toBe("localhost/test")
  })
})
