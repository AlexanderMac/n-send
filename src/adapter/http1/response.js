const zlib = require('zlib');
const NSendError = require('../../error');
const dataTransformers = require('../data-transformers');

class NSendResponse {
  static processResponse(options) {
    let instance = new NSendResponse(options);
    return instance.processResponse();
  }

  constructor({ req, res, maxContentLength, responseType, responseEncoding, done }) {
    this.req = req;
    this.res = res;
    this.maxContentLength = maxContentLength;
    this.responseType = responseType;
    this.responseEncoding = responseEncoding;
    this.done = done;
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
      statusCode: this.res.statusCode,
      statusText: this.res.statusMessage,
      headers: this.res.headers,
      reqHeaders: this.req.getHeaders()
    };
    if (this.responseType === 'stream') {
      this.response.data = this.resStream;
      return this.done(this.response);
    }
    this._processResponseStream();
  }

  _processResponseStream() {
    let resDataBuffer = [];

    this.resStream.on('error', err => {
      if (this.req.aborted) {
        return;
      }
      this.done(new NSendError(err));
    });

    this.resStream.on('data', chunk => {
      resDataBuffer.push(chunk);
      if (this.maxContentLength > -1 && Buffer.concat(resDataBuffer).length > this.maxContentLength) {
        this.resStream.destroy();
        this.done(new NSendError('MaxContentLength size of ' + this.maxContentLength + ' exceeded'));
      }
    });

    this.resStream.on('end', () => {
      let resData = Buffer.concat(resDataBuffer).toString(this.responseEncoding);
      this.response.data = dataTransformers.transformResponseData(resData, this.responseType);
      this.done(this.response);
    });
  }
}

module.exports = NSendResponse;
