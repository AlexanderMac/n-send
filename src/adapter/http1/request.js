const http = require('http');
const https = require('https');
const NSendError = require('../../error');
const checks = require('../../utils/checks');

class NSendRequest {
  static performRequest(opts) {
    let instance = new NSendRequest(opts);
    return instance.performRequest();
  }

  constructor({ reqOpts, protocol, timeout, data, processResponse, resolve, reject }) {
    this.reqOpts = reqOpts;
    this.protocol = protocol;
    this.timeout = timeout;
    this.data = data;
    this.processResponse = processResponse;
    this.resolve = resolve;
    this.reject = reject;
  }

  // TODO: test it
  performRequest() {
    let data = this._transformRequestData();
    let transport = this._getTransport();

    let req = transport.request(this.reqOpts, this.processResponse);

    req.on('error', err => {
      if (req.aborted) {
        return;
      }
      this.reject(new NSendError(err));
    });

    if (this.timeout) {
      this.timer = setTimeout(() => {
        if (this.finalized) {
          return;
        }
        req.abort();
        this.reject(new NSendError('Timeout of ' + this.timeout + 'ms exceeded'));
      }, this.timeout);
    }

    if (checks.isStream(data)) {
      data
        .on('error', err => this.reject(new NSendError(err)))
        .pipe(req);
    } else {
      req.end(data);
    }

    req.finalize = () => {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.finalized = true;
    };

    return req;
  }

  _getTransport() {
    let isHttps = this.reqOpts.protocol === 'https:';
    return isHttps ? https : http;
  }

  _transformRequestData() {
    let headers = this.reqOpts.headers;
    let data = this.data;
    if (checks.isNil(data)) {
      return data;
    }
    if (checks.isStream(data)) {
      return data;
    }

    if (checks.isBuffer(data)) {
      // Nothing to do...
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
}

module.exports = NSendRequest;
