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
