const _       = require('lodash');
const consts  = require('../consts');
const adapter = require('../adapter');

class NSendCore {
  static getInstance() {
    return new NSendCore();
  }

  static send(opts) {
    let instance = new NSendCore();
    return instance.send(opts);
  }

  async send(opts) {
    this._mergeOpts(opts);
    this._validateOpts();

    // TODO: implement it
    // if (this.maxRedirects === 0) {
    let res = await adapter.performRequest({
      method: this.method,
      baseUrl: this.baseUrl,
      url: this.url,
      params: this.params,
      auth: this.auth,
      headers: this.headers,
      timeout: this.timeout,
      maxContentLength: this.maxContentLength,
      responseType: this.responseType,
      responseEncoding: this.responseEncoding,
      data: this.data
    });
    return res;
    // }

    /* TODO: implement it
    let redirectCount = 0;
    do {
      let res = request.performRequest(reqOpts); // TODO: tons of params above
      if (res.statusCode < 300 && res.statusCode >= 400) {
        return this._transformResponse(res);
      }
    } while (redirectCount < this.maxRedirects);
    */
  }

  _mergeOpts(opts) {
    let defaults = _.cloneDeep(consts.DEFAULT_OPTS);
    let custom = _.chain(opts)
      .pick(consts.ALLOWED_OPT_KEYS)
      .cloneDeep()
      .value();
    let merged = _.extend(
      defaults,
      custom
    );

    this.baseUrl = merged.baseUrl;
    this.url = merged.url;
    this.method = _.toLower(merged.method);
    this.params = merged.params;
    this.auth = merged.auth;
    this.headers = _.reduce(merged.headers, (result, value, name) => {
      result[_.toLower(name)] = value;
      return result;
    }, {});
    this.data = merged.data;
    this.timeout = merged.timeout;
    this.maxContentLength = merged.maxContentLength;
    this.maxRedirects = merged.maxRedirects;
    this.responseType = merged.responseType;
    this.responseEncoding = merged.responseEncoding;
  }

  _validateOpts() {
    // TODO: implement it
  }
}

module.exports = NSendCore;
