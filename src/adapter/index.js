const _ = require('lodash');
const consts = require('../consts');
const request = require('./http1/request');
const response = require('./http1/response');
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
    }).then(res => {
      this._cleanup();
      return res;
    }).catch(err => {
      this._cleanup();
      throw err;
    });
    /* TODO: use it when Node version will be >=10
    .finally(() => this._cleanup());
    */
  }

  _performRequest() {
    let opts = this._createOpts(['protocol', 'timeout']);
    opts.reqOpts = this._getReqOpts();
    opts.data = this.opts.data;
    opts.resolve = this.resolve;
    opts.reject = this.reject;
    opts.processResponse = this._processResponse.bind(this);
    this.req = request.performRequest(opts);
  }

  _processResponse(res) {
    let opts = this._createOpts(['maxContentLength', 'responseType', 'responseEncoding']);
    opts.req = this.req;
    opts.res = res;
    opts.resolve = this.resolve;
    opts.reject = this.reject;
    response.processResponse(opts);
  }

  _createOpts(pickOpts) {
    return _.chain(this.opts)
      .pick(pickOpts)
      .clone()
      .value();
  }

  _getReqOpts() {
    let reqOpts = _.pick(this.opts, consts.REQUEST_KEYS);
    return reqOptsBuilder.build(reqOpts);
  }

  _cleanup() {
    if (this.req) {
      this.req.finalize();
      // To prevent possibly memory leaks
      this.req.processResponse = null;
      this.req = null;
    }
  }
}

module.exports = NSendAdapter;
