const _ = require('lodash');
const zlib = require('zlib');
const NSendError = require('../error');

class NSendResponse {
  static processResponse(opts) {
    let instance = new NSendResponse(opts);
    return instance.processResponse();
  }

  constructor({ req, res, maxContentLength, responseType, responseEncoding, resolve, reject }) {
    this.req = req;
    this.res = res;
    this.maxContentLength = maxContentLength;
    this.responseType = responseType;
    this.responseEncoding = responseEncoding;
    this.resolve = resolve;
    this.reject = reject;
  }

  processResponse() {
    if (this.req.aborted) {
      return;
    }

    // uncompress the response body transparently if required
    this.resStream = this.res;
    switch (this.res.headers['content-encoding']) {
      case 'gzip':
      case 'compress':
      case 'deflate':
        // add the unzipper to the body stream processing pipeline
        this.resStream = this.res.statusCode === 204 ?
          this.resStream :
          this.resStream.pipe(zlib.createUnzip());
        // remove the content-encoding in order to not confuse downstream operations
        delete this.res.headers['content-encoding'];
        break;
    }

    this.response = {
      status: this.res.statusCode,
      statusText: this.res.statusMessage,
      headers: this.res.headers,
      request: this.req
    };
    if (this.responseType === 'stream') {
      this.response.data = this.resStream;
      return this.resolve(this.response);
    }
    this._processResponseStream();
  }

  _processResponseStream() {
    let resDataBuffer = [];
    this.resStream.on('data', chunk => {
      resDataBuffer.push(chunk);
      if (this.maxContentLength > -1 && Buffer.concat(resDataBuffer).length > this.maxContentLength) {
        this.resStream.destroy();
        this.reject(new NSendError('MaxContentLength size of ' + this.maxContentLength + ' exceeded'));
      }
    });

    this.resStream.on('error', err => {
      if (this.req.aborted) {
        return;
      }
      this.reject(new NSendError(err));
    });

    this.resStream.on('end', () => {
      let resData = Buffer.concat(resDataBuffer).toString(this.responseEncoding);
      this.response.data = this._transformResponseData(resData);
      this.resolve(this.response);
    });
  }

  _transformResponseData(data) {
    if (this.responseType === 'json') {
      let parsedData = _.attempt(JSON.parse.bind(null, data));
      if (!_.isError(parsedData)) {
        return parsedData;
      }
    }
    return data;
  }
}

module.exports = NSendResponse;
