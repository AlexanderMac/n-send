const _              = require('lodash');
const request        = require('./request');
const response       = require('./response');
const reqOptsBuilder = require('./request-options-builder');

class NSendAdapter {
  static performRequest(opts) {
    let instance = new NSendAdapter(opts);
    return instance.performRequest();
  }

  constructor(opts) {
    this.opts = opts;
  }

  performRequest() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this._performRequest();
    }).finally(() => {
      this.req.finalize();
    });
  }

  _performRequest() {
    let opts = this._getOpts(['protocol', 'timeout']);
    opts.reqOps = this._getReqOpts();
    opts.data = this.opts.data;
    opts.resolve = this.resolve;
    opts.reject = this.reject;
    opts.processResponse = this._processResponse.bind(this);
    this.req = request.performRequest(opts);
  }

  _processResponse(res) {
    let opts = this._getOpts(['maxContentLength', 'responseType', 'responseEncoding']);
    opts.req = this.req;
    opts.resolve = this.resolve;
    opts.reject = this.reject;
    this.res = response.processResponse(res);
  }

  _getOpts(pickOpts) {
    return _.chain(this.opts)
      .pick(pickOpts)
      .clone()
      .value();
  }

  _getReqOpts() {
    return reqOptsBuilder.build({
      method: this.opts.method,
      baseUrl: this.opts.baseUrl,
      url: this.opts.url,
      params: this.opts.params,
      auth: this.opts.auth,
      headers: this.opts.headers
    });
  }
}

module.exports = NSendAdapter;
