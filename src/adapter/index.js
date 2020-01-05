const _ = require('lodash');
const consts = require('../consts');
const request = require('./http1/request');

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
      this.done = (result) => {
        if (_.isError(result)) {
          reject(result);
        } else {
          resolve(result);
        }
      };
      this._performRequest();
    }).finally(() => this._cleanup());
  }

  _performRequest() {
    let reqOptions = _.chain(this.options)
      .pick(consts.REQUEST_OPTION_KEYS)
      .extend({
        done: this.done
      })
      .value();
    this.req = request.performRequest(reqOptions);
  }

  _cleanup() {
    if (this.req) {
      this.req.finalize();
      this.req = null;
    }
  }
}

module.exports = NSendAdapter;
