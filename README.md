# Rails Request.JS

Rails Request.JS encapsulates the logic to send by default some headers that are required by rails applications like the `X-CSRF-Token`.

# Install

## Asset Pipeline

Install the [requestjs-rails](https://github.com/rails/requestjs-rails) gem and follow the step described there.

## Webpacker/Esbuild

### npm
```
npm i @rails/request.js
```
### yarn
```shell
yarn add @rails/request.js
```

# How to use

Just import the `FetchRequest` class from the package and instantiate it passing the request `method`, `url`, `options`,  then call `await request.perform()` and do what you need with the response.

Example:

```js
import { FetchRequest } from '@rails/request.js'

....

async myMethod () {
  const request = new FetchRequest('post', 'localhost:3000/my_endpoint', { body: JSON.stringify({ name: 'Request.JS' }) })
  const response = await request.perform()
  if (response.ok) {
    const body = await response.text
    // Do whatever do you want with the response body
    // You also are able to call `response.html` or `response.json`, be aware that if you call `response.json` and the response contentType isn't `application/json` there will be raised an error.
  }
}
```

#### Shorthand methods

Alternatively, you can use a shorthand version for the main HTTP verbs, `get`, `post`, `put`, `patch` or `destroy`.

Example:

```js
import { get, post, put, patch, destroy } from '@rails/request.js'

...

async myMethod () {
  const response = await post('localhost:3000/my_endpoint', { body: JSON.stringify({ name: 'Request.JS' }) })
  if (response.ok) {
    ...
  }
}
```

#### Request Options

You can pass options to a request as the last argument. For example:

```javascript
post("/my_endpoint", {
  body: {},
  contentType: "application/json",
  headers: {},
  query: {},
  responseKind: "html"
})
```

##### body

This is the `body` for POST requests. You can pass in a Javascript object, FormData, Files, strings, etc.

Request.js will automatically JSON stringify the `body` if the content type is `application/json`.

##### contentType

When provided this value will be sent in the `Content-Type` header. When not provided Request.JS will send nothing when the `body` of the request is `null` or an instance of `FormData`, when the `body` is an instance of a `File` then the type of the file will be sent and `application/json` will be sent if none of the prior conditions matches.

##### headers

Adds additional headers to the request.  `X-CSRF-Token` and `Content-Type` are automatically included.

##### credentials

Specifies the `credentials` option. Default is `same-origin`.

##### query

Appends query parameters to the URL. Query params in the URL are preserved and merged with the query options.

Accepts `Object`, `FormData` or `URLSearchParams`.

##### responseKind

Specifies which response format will be accepted. Default is `html`.

Options are `html`, `turbo-stream`, `json`.

#### Turbo Streams

Request.JS will automatically process Turbo Stream responses. Ensure that your Javascript sets the `window.Turbo` global variable:

```javascript
import { Turbo } from "@hotwired/turbo-rails"
window.Turbo = Turbo
```

Since [v7.0.0-beta.6](https://github.com/hotwired/turbo/releases/tag/v7.0.0-beta.6) Turbo sets `window.Turbo` automatically.

#### Request Interceptor

To authenticate fetch requests (eg. with Bearer token) you can use request interceptor. It allows pausing request invocation for fetching token and then adding it to headers:

```javascript
import { RequestInterceptor } from '@rails/request.js'
// ...

// Set interceptor
RequestInterceptor.register(async (request) => {
  const token = await getSessionToken(window.app)
  request.addHeader('Authorization', `Bearer ${token}`)
})

// Reset interceptor
RequestInterceptor.reset()
```

#### Before and after hooks

Wrap the request `Promise` with your own code. Just pure and simple JavaScript like this:

```javascript
import { FetchRequest } from "@rails/request.js"
import { navigator } from "@hotwired/turbo"

function showProgressBar() {
  navigator.delegate.adapter.progressBar.setValue(0)
  navigator.delegate.adapter.progressBar.show()
}

function hideProgressBar() {
  navigator.delegate.adapter.progressBar.setValue(1)
  navigator.delegate.adapter.progressBar.hide()
}

export function withProgress(request) {
  showProgressBar()

  return request.then((response) => {
    hideProgressBar()
    return response
  })
}

export function get(url, options) {
  const request = new FetchRequest("get", url, options)
  return withProgress(request.perform())
}
```

## Response

### statusCode

Returns the response status.

### ok

Returns true if the response was successful.

### unauthenticated

Returns true if the response has a `401` status code.

### authenticationURL

Returns the value contained in the `WWW-Authenticate` header.

### contentType

Returns the response content-type.

### html

Returns the html body, if the content type of the response isn't `html` then will be returned a rejected promise.

### json

Returns the json body, if the content type of the response isn't `json` then will be returned a rejected promise.

### headers

Returns the response headers.

# Known Issues

`FetchRequest` sets a `"X-Requested-With": "XmlHttpRequest"` header. If you have not upgraded to Turbo and still use `Turbolinks` in your Gemfile, this means
you will not be able to check if the request was redirected.

```js
  const request = new FetchRequest('post', 'localhost:3000/my_endpoint', { body: JSON.stringify({ name: 'Request.JS' }) })
  const response = await request.perform()
  response.redirected // => will always be false.
```

# License

Rails Request.JS is released under the [MIT License](LICENSE).

© 2021 Basecamp, LLC.
