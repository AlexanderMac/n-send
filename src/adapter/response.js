const zlib       = require('zlib');
const NSendError = require('../error');

class NSendResponse {
  static processResponse(opts) {
    let instance = new NSendResponse(opts);
    return instance.processResponse();
  }

  constructor({ req, maxContentLength, responseType, responseEncoding, resolve, reject }) {
    this.req = req;
    this.maxContentLength = maxContentLength;
    this.responseType = responseType;
    this.responseEncoding = responseEncoding;
    this.resolve = resolve;
    this.reject = reject;
  }

  processResponse(res) {
    if (this.req.aborted) {
      return;
    }

    // uncompress the response body transparently if required
    this.resStream = res;
    switch (res.headers['content-encoding']) {
      case 'gzip':
      case 'compress':
      case 'deflate':
        // add the unzipper to the body stream processing pipeline
        this.resStream = res.statusCode === 204 ? this.resStream : this.resStream.pipe(zlib.createUnzip());
        // remove the content-encoding in order to not confuse downstream operations
        delete res.headers['content-encoding'];
        break;
    }

    this.response = {
      status: res.statusCode,
      statusText: res.statusMessage,
      headers: res.headers,
      request: this.req
    };
    if (this.responseType === 'stream') {
      this.response.data = this.resStream;
      return this.resolve(this.response);
    }
    this._processResponseStream();
  }

  _processResponseStream() {
    let responseBuffer = [];
    this.resStream.on('data', chunk => {
      responseBuffer.push(chunk);
      if (this.maxContentLength > -1 && Buffer.concat(responseBuffer).length > this.maxContentLength) {
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
      let responseData = Buffer.concat(responseBuffer);
      if (this.responseType !== 'arraybuffer') {
        responseData = responseData.toString(this.responseEncoding);
      }

      this.response.data = this._transformResponseData(responseData);
      this.resolve(this.response);
    });
  }

  _transformResponseData(data) {
    // TODO: implement
    return data;
  }
}

module.exports = NSendResponse;
