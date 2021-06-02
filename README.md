# Rails Fetch

Rails Fetch encapsulates the logic to send by default some headers that are required by rails applications like the `X-CSRF-Token`.

# Install

### npm
```
npm i rails-fetch
```
### yarn
```shell
yarn add rails-fetch
```

# How to use

Just import the `Request` class from the package and instantiate it passing the request `method`, `url`, `options`,  then call `await request.perform()` and do what do you need with the response.

Example:

```js
import { Request } from 'rails-fetch'

....

async myMethod () {
  const request = new Request('post', 'localhost:3000/my_endpoint', { body: { name: 'Rails Fetch' }})
  const response = await request.perform()
  if (response.ok) {
    const body = await response.text
    // Do whatever do you want with the response body
    // You also are able to call `response.html` or `response.json`, be aware that if you call `response.json` and the response contentType isn't `application/json` there will be raised an error.
  }
}
```

# Credits

[Basecamp](https://github.com/basecamp), since this piece of code has been extracted from hey.com.

# License

Rails Fetch is released under the [MIT License](LICENSE).