const DEFAULT_OPTIONS = {
  method: 'get',
  maxContentLength: 10000,
  maxRedirects: 0,
  responseType: 'text',
  responseEncoding: 'utf8'
};

const ALLOWED_OPTION_KEYS = [
  'httpVer',
  'method',
  'baseUrl',
  'url',
  'params',
  'auth',
  'headers',
  'data',
  'timeout',
  'maxContentLength',
  'maxRedirects',
  'responseType',
  'responseEncoding'
];

const ADAPTER_OPTION_KEYS = [
  'httpVer',
  'method',
  'baseUrl',
  'url',
  'params',
  'auth',
  'headers',
  'data',
  'timeout',
  'maxContentLength',
  'responseType',
  'responseEncoding'
];

const REQUEST_OPTION_KEYS = [
  'method',
  'baseUrl',
  'url',
  'params',
  'auth',
  'headers'
];

const SAFE_METHODS = ['get', 'head', 'options', 'trace'];

module.exports = {
  DEFAULT_OPTIONS,
  ALLOWED_OPTION_KEYS,
  ADAPTER_OPTION_KEYS,
  REQUEST_OPTION_KEYS,
  SAFE_METHODS
};
