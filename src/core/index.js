const _ = require('lodash');
const consts = require('../consts');
const adapter = require('../adapter');
const NSendError = require('../error');

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

    let res = await adapter.performRequest(this._getRequestParams());
    res = await this._followRedirects(res);
    res.redirects = this.redirects;

    return res;
  }

  // eslint-disable-next-line max-statements
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
    this.redirectCount = 0;
    this.responseType = merged.responseType;
    this.responseEncoding = merged.responseEncoding;
    this.redirects = [];
  }

  _validateOpts() {
    // TODO: implement it
  }

  _getRequestParams() {
    return {
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
    };
  }

  // eslint-disable-next-line max-statements
  async _followRedirects(res) {
    if (this.maxRedirects === 0) {
      return res;
    }
    let location = res.headers.location;
    if (!location || res.statusCode < 300 || res.statusCode >= 400) {
      return res;
    }

    this.redirectCount++;
    if (this.redirectCount > this.maxRedirects) {
      throw new NSendError('Max redirects exceeded');
    }

    this.redirects.push({
      url: this.url,
      statusCode: res.statusCode,
      headers: res.headers
    });
    if (res.statusCode !== 307 && !_.includes(consts.SAFE_METHODS, this.method)) {
      this.method = 'GET';
      this.headers = _.reduce(this.headers, (result, value, name) => {
        if (!/^content-/i.test(name)) {
          result[name] = value;
        }
        return result;
      }, {});
    }
    this.url = location;
    this.baseUrl = undefined;
    this.data = undefined;

    res = await adapter.performRequest(this._getRequestParams());
    return this._followRedirects(res);
  }
}

module.exports = NSendCore;
