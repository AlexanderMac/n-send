const http       = require('http');
const https      = require('https');
const NSendError = require('../error');
const checks     = require('../utils/checks');

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

  finalize() {
    if (this.timer) {
      this.finilized = true;
      clearTimeout(this.timer);
    }
  }

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
        if (this.finilized) {
          return;
        }
        req.abort();
        this.reject(new NSendError('Timeout of ' + this.timeout + 'ms exceeded'));
      }, this.timeout);
    }

    if (checks.isStream(data)) {
      data
        .on('error', err => {
          this.reject(new NSendError(err));
        })
        .pipe(req);
    } else {
      req.end(data);
    }
  }

  _getTransport() {
    let isHttps = this.protocol === 'https';
    return isHttps ? https : http;
  }

  // eslint-disable-next-line complexity, max-statements
  _transformRequestData() {
    let headers = this.reqOpts.headers;
    let data = this.data;
    if (checks.isNil(data)) {
      return data;
    }

    if (checks.isBuffer(data) ||
        checks.isArrayBuffer(data) ||
        checks.isStream(data) ||
        checks.isFile(data) ||
        checks.isBlob(data)
    ) {
      // Nothing to do...
    } else if (checks.isArrayBufferView(data)) {
      data = data.buffer;
    } else if (checks.isURLSearchParams(data)) {
      headers['content-type'] = 'application/x-www-form-urlencoded;charset=utf-8';
      data = data.toString();
    } else if (checks.isObject(data)) {
      headers['content-type'] = 'application/json;charset=utf-8';
      data = JSON.stringify(data);
    }

    if (!checks.isStream(data)) {
      if (checks.isBuffer(data)) {
        // Nothing to do...
      } else if (checks.isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data));
      } else if (checks.isString(data)) {
        data = Buffer.from(data, 'utf-8');
      } else {
        throw new NSendError('Data must be string, ArrayBuffer, Buffer, or Stream');
      }
      headers['content-length'] = data.length;
    }

    return data;
  }
}

module.exports = NSendRequest;
