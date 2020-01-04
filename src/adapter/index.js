const _ = require('lodash');
const consts = require('../consts');
const request = require('./http1/request');
const response = require('./http1/response');
const reqOptionsBuilder = require('./request-options-builder');

class NSendAdapter {
  static performRequest(options) {
    let instance = new NSendAdapter(options);
    return instance.performRequest();
  }

  constructor(options) {
    this.options = options;
  }

  performRequest() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this._performRequest();
    }).finally(() => this._cleanup());
  }

  _performRequest() {
    let options = this._createOptions(['protocol', 'timeout']);
    options.reqOptions = this._getReqOptions();
    options.data = this.options.data;
    options.resolve = this.resolve;
    options.reject = this.reject;
    options.processResponse = this._processResponse.bind(this);
    this.req = request.performRequest(options);
  }

  _processResponse(res) {
    let options = this._createOptions(['maxContentLength', 'responseType', 'responseEncoding']);
    options.req = this.req;
    options.res = res;
    options.resolve = this.resolve;
    options.reject = this.reject;
    response.processResponse(options);
  }

  _createOptions(pickOptions) {
    return _.chain(this.options)
      .pick(pickOptions)
      .clone()
      .value();
  }

  _getReqOptions() {
    let reqOptions = _.pick(this.options, consts.REQUEST_OPTION_KEYS);
    return reqOptionsBuilder.build(reqOptions);
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
