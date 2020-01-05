const _ = require('lodash');
const http = require('http');
const https = require('https');
const consts = require('../../consts');
const NSendError = require('../../error');
const checks = require('../../utils/checks');
const reqOptionsBuilder = require('../request-options-builder');
const response = require('./response');

class NSendRequest {
  static performRequest(options) {
    let instance = new NSendRequest(options);
    return instance.performRequest();
  }

  constructor({ data, timeout, done, ...options }) {
    this.options = options;
    this.data = data;
    this.timeout = timeout;
    this.done = done;
  }

  performRequest() {
    let reqOptions = _.pick(this.options, consts.REQUEST_OPTION_KEYS);
    reqOptions = reqOptionsBuilder.build(reqOptions);

    let data = this._transformRequestData(reqOptions.headers, this.data);
    let transport = this._getTransport(reqOptions.protocol);
    this.req = transport.request(reqOptions, this._processResponse.bind(this));

    this.req.on('error', err => {
      if (this.req.aborted) {
        return;
      }
      this.done(new NSendError(err));
    });

    if (this.timeout) {
      this.timer = setTimeout(() => {
        if (this.finalized) {
          return;
        }
        this.req.abort();
        this.done(new NSendError('Timeout of ' + this.timeout + 'ms exceeded'));
      }, this.timeout);
    }

    if (checks.isStream(data)) {
      data
        .on('error', err => this.done(new NSendError(err)))
        .pipe(this.req);
    } else {
      this.req.end(data);
    }

    return this;
  }

  _getTransport(protocol) {
    let isHttps = protocol === 'https:';
    return isHttps ? https : http;
  }

  _transformRequestData(headers, data) {
    if (checks.isNil(data)) {
      return data;
    }
    if (checks.isStream(data)) {
      return data;
    }

    if (checks.isBuffer(data)) {
      // Nothing
    } else if (checks.isString(data)) {
      data = Buffer.from(data, 'utf8');
    } else if (checks.isObject(data)) {
      data = JSON.stringify(data);
      data = Buffer.from(data, 'utf8');
    } else {
      throw new NSendError('Data must be Stream, Buffer, Object or String');
    }
    headers['content-length'] = data.length;

    return data;
  }

  _processResponse(res) {
    let resOptions = _.chain(this.options)
      .pick(consts.RESPONSE_OPTION_KEYS)
      .extend({
        req: this.req,
        res,
        done: this.done
      })
      .value();
    response.processResponse(resOptions);
  }

  finalize() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.finalized = true;
  }
}

module.exports = NSendRequest;
