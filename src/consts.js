const BASE_OPTION_KEYS = {
  protocolVersion: 'protocolVersion',
  method: 'method',
  baseUrl: 'baseUrl',
  url: 'url',
  params: 'params',
  auth: 'auth',
  headers: 'headers',
  data: 'data',
  timeout: 'timeout',
  maxContentLength: 'maxContentLength',
  maxRedirects: 'maxRedirects',
  responseType: 'responseType',
  responseEncoding: 'responseEncoding'
}

const HTTP_VERSIONS = {
  http10: 'http/1.0',
  http11: 'http/1.1',
  http20: 'http/2.0'
}

const DEFAULT_OPTIONS = {
  [BASE_OPTION_KEYS.protocolVersion]: HTTP_VERSIONS.http11,
  [BASE_OPTION_KEYS.method]: 'get',
  [BASE_OPTION_KEYS.maxContentLength]: 10000,
  [BASE_OPTION_KEYS.maxRedirects]: 0,
  [BASE_OPTION_KEYS.responseType]: 'text',
  [BASE_OPTION_KEYS.responseEncoding]: 'utf8'
}

const CORE_OPTION_KEYS = [
  BASE_OPTION_KEYS.protocolVersion,
  BASE_OPTION_KEYS.method,
  BASE_OPTION_KEYS.baseUrl,
  BASE_OPTION_KEYS.url,
  BASE_OPTION_KEYS.params,
  BASE_OPTION_KEYS.auth,
  BASE_OPTION_KEYS.headers,
  BASE_OPTION_KEYS.data,
  BASE_OPTION_KEYS.timeout,
  BASE_OPTION_KEYS.maxContentLength,
  BASE_OPTION_KEYS.maxRedirects,
  BASE_OPTION_KEYS.responseType,
  BASE_OPTION_KEYS.responseEncoding
]

const ADAPTER_OPTION_KEYS = [
  BASE_OPTION_KEYS.protocolVersion,
  BASE_OPTION_KEYS.method,
  BASE_OPTION_KEYS.baseUrl,
  BASE_OPTION_KEYS.url,
  BASE_OPTION_KEYS.params,
  BASE_OPTION_KEYS.auth,
  BASE_OPTION_KEYS.headers,
  BASE_OPTION_KEYS.data,
  BASE_OPTION_KEYS.timeout,
  BASE_OPTION_KEYS.maxContentLength,
  BASE_OPTION_KEYS.responseType,
  BASE_OPTION_KEYS.responseEncoding
]

const REQUEST_OPTION_KEYS = [
  BASE_OPTION_KEYS.method,
  BASE_OPTION_KEYS.baseUrl,
  BASE_OPTION_KEYS.url,
  BASE_OPTION_KEYS.params,
  BASE_OPTION_KEYS.auth,
  BASE_OPTION_KEYS.headers,
  BASE_OPTION_KEYS.data,
  BASE_OPTION_KEYS.timeout,
  BASE_OPTION_KEYS.maxContentLength,
  BASE_OPTION_KEYS.responseType,
  BASE_OPTION_KEYS.responseEncoding
]

const RESPONSE_OPTION_KEYS = [
  BASE_OPTION_KEYS.maxContentLength,
  BASE_OPTION_KEYS.responseType,
  BASE_OPTION_KEYS.responseEncoding
]

const SAFE_METHODS = ['get', 'head', 'options', 'trace']

module.exports = {
  HTTP_VERSIONS,
  DEFAULT_OPTIONS,
  CORE_OPTION_KEYS,
  ADAPTER_OPTION_KEYS,
  REQUEST_OPTION_KEYS,
  RESPONSE_OPTION_KEYS,
  SAFE_METHODS
}
