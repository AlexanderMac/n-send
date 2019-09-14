# n-send

[![Build Status](https://travis-ci.org/AlexanderMac/n-send.svg?branch=master)](https://travis-ci.org/AlexanderMac/n-send)
[![Code Coverage](https://codecov.io/gh/AlexanderMac/n-send/branch/master/graph/badge.svg)](https://codecov.io/gh/AlexanderMac/n-send)
[![npm version](https://badge.fury.io/js/n-send.svg)](https://badge.fury.io/js/n-send)

## Features

- Simple configuration
- Promise API
- Proxy support (TODO)
- Follows redirects (TODO)
- Request cancelation (TODO)
- Retries on failure (TODO)
- Timeout handling

## Usage
```js
const nsend = require('nsend');

let res1 = await nsend(opts);
// OR
let ns = nsend.getInstance(opts);
let res2 = await nsend.send();
```

## API

### NSend Options

```js
{
  // `baseURL` to resolve against if the input is not absolute
  baseURL: 'https://example.com/api',

  // `url` is the server URL that will be used for the request
  url: '/users',

  // `method` is the request method to be used when making the request
  method: 'get', // default

  // `headers` are custom headers to be sent in `name: value` format
  headers: { 'Connection': 'keep-alive' },

  // `params` are the URL parameters to be sent with the request
  // Must be a plain object
  params: {
    ts: 7567182746126
  },

  // `auth` indicates that HTTP Basic auth should be used
  // This will set an `Authorization` header, overwriting any existing
  auth: {
    username: 'smith',
    password: 'password'
  },

  // `data` is the data to be sent as the request body
  // Only applicable for request methods 'POST', 'PUT', 'PATCH'
  // Should be a `ReadStream`, `Buffer` or `String`
  data: {
    username: 'smith'
  },

  // `timeout` specifies the number of milliseconds before the request times out
  timeout: 0, // default

  // `maxContentLength` defines the max size of the http response content in bytes allowed
  maxContentLength: 10000, // default

  // `maxRedirects` defines the maximum number of redirects to follow, if set to 0, no redirects will be followed
  maxRedirects: 0 // default

  // `responseType` indicates the type of data that the server will respond with
  // options are: 'json', 'text', 'stream'
  responseType: 'json', // default

  // `responseEncoding` indicates encoding to use for decoding responses
  // Note: Ignored for `responseType` of 'stream'
  responseEncoding: 'utf8', // default
}
```

## Author
Alexander Mac

## Licence
Licensed under the MIT license.
