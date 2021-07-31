# Rails Request.JS

Rails Request.JS encapsulates the logic to send by default some headers that are required by rails applications like the `X-CSRF-Token`.

# Install

### npm
```
npm i @rails/request.js
```
### yarn
```shell
yarn add @rails/request.js
```

# How to use

Just import the `FetchRequest` class from the package and instantiate it passing the request `method`, `url`, `options`,  then call `await request.perform()` and do what do you need with the response.

Example:

```js
import { FetchRequest } from '@rails/request.js'

....

async myMethod () {
  const request = new FetchRequest('post', 'localhost:3000/my_endpoint', { body: { name: 'Request.JS' }})
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
  const response = await post('localhost:3000/my_endpoint', { body: { name: 'Request.JS' }})
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

##### query

Appends query parameters to the URL.

##### responseKind

You can provide this option to specify which kind of response will be accepted. Default is `html`.

Options are `html`, `turbo-stream`, `json`.

#### Turbo Streams

Request.JS will automatically process Turbo Stream responses. Ensure that your Javascript sets the `window.Turbo` global variable:

```javascript
import { Turbo } from "@hotwired/turbo-rails"
window.Turbo = Turbo
```

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

# Known Issues

`FetchRequest` sets a `"X-Requested-With": "XmlHttpRequest"` header. If you have not upgraded to Turbo and still use `Turbolinks` in your Gemfile, this means
you will not be able to check if the request was redirected.

```js
  const request = new FetchRequest('post', 'localhost:3000/my_endpoint', { body: { name: 'Request.JS' }})
  const response = await request.perform()
  response.redirected // => will always be false.
```

# License

Rails Request.JS is released under the [MIT License](LICENSE).

© 2021 Basecamp, LLC.