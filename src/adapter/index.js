const _ = require('lodash');
const consts = require('../consts');
const request1 = require('./http1/request');
const request2 = require('./http2/request');

class NSendAdapter {
  static performRequest(options) {
    let instance = new NSendAdapter(options);
    return instance.performRequest();
  }

  constructor({ protocolVersion, ...options }) {
    this.protocolVersion = protocolVersion;
    this.options = options;
  }

  performRequest() {
    return new Promise((resolve, reject) => {
      this.done = (result) => {
        if (_.isError(result)) {
          reject(result);
        } else {
          resolve(result);
        }
      };
      let reqOptions = this._getRequestOptions();
      switch (this.protocolVersion) {
        case consts.HTTP_VERSIONS.http10:
        case consts.HTTP_VERSIONS.http11:
          this.req = request1.performRequest(reqOptions);
          break;
        case consts.HTTP_VERSIONS.http20:
          this.req = request2.performRequest(reqOptions);
          break;
      }
    }).finally(() => this._cleanup());
  }

  _getRequestOptions() {
    return _.chain(this.options)
      .pick(consts.REQUEST_OPTION_KEYS)
      .extend({
        done: this.done
      })
      .value();
  }

  _cleanup() {
    if (this.req) {
      this.req.finalize();
      this.req = null;
    }
  }
}

module.exports = NSendAdapter;
