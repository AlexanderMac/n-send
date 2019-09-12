const DEFAULT_OPTS = {
  method: 'get',
  maxContentLength: 10000,
  maxRedirects: 0,
  responseType: 'text',
  responseEncoding: 'UTF-8'
};

const ALLOWED_OPT_KEYS = [
  'baseUrl',
  'url',
  'method',
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

module.exports = {
  DEFAULT_OPTS,
  ALLOWED_OPT_KEYS
};
