const _ = require('lodash');
const http2 = require('http2');
const consts = require('../../consts');
const NSendError = require('../../error');
const reqOptionsBuilder = require('../request-options-builder');
const dataTransformers = require('../data-transformers');

const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  NGHTTP2_CANCEL,
  NGHTTP2_INTERNAL_ERROR
} = http2.constants;

class NSendRequest2 {
  static performRequest(options) {
    let instance = new NSendRequest2(options);
    return instance.performRequest();
  }

  constructor({ data, timeout, maxContentLength, responseEncoding, responseType, done, ...options }) {
    this.options = options;
    this.data = data;
    this.timeout = timeout;
    this.maxContentLength = maxContentLength;
    this.responseEncoding = responseEncoding;
    this.responseType = responseType;
    this.done = done;
  }

  // eslint-disable-next-line max-statements
  performRequest() {
    let reqOptions = _.pick(this.options, consts.REQUEST_OPTION_KEYS);
    let authority = reqOptionsBuilder.build(reqOptions);

    let resHeaders;
    let resDataBuffer = [];
    let reqData = dataTransformers.transformRequestData(this.data, authority.headers);

    let client = http2.connect(authority);
    let req = client.request(this._getOutgoingHeaders(authority));

    if (this.timeout) {
      this.timer = setTimeout(() => {
        if (this.finalized) {
          return;
        }
        client.close(NGHTTP2_CANCEL);
        this.done(new NSendError('Timeout of ' + this.timeout + 'ms exceeded'));
      }, this.timeout);
    }

    req.on('error', err => this.done(new NSendError(err)));
    req.on('response', headers => resHeaders = headers);
    req.on('data', chunk => {
      resDataBuffer.push(chunk);
      if (this.maxContentLength > -1 && Buffer.concat(resDataBuffer).length > this.maxContentLength) {
        client.close(NGHTTP2_INTERNAL_ERROR);
        this.done(new NSendError('MaxContentLength size of ' + this.maxContentLength + ' exceeded'));
      }
    });
    req.on('end', () => {
      let resData = Buffer.concat(resDataBuffer).toString(this.responseEncoding);
      resData = dataTransformers.transformResponseData(resData, this.responseType);
      this.done({
        statusCode: resHeaders[HTTP2_HEADER_STATUS],
        statusText: '', // for http/2 is undefined
        headers: this._omitPseudoHeaders(resHeaders),
        reqHeaders: this._omitPseudoHeaders(req.sentHeaders),
        data: resData
      });
      client.close();
    });

    req.end(reqData);

    return this;
  }

  _getOutgoingHeaders(authority) {
    return _.extend(authority.headers, {
      [HTTP2_HEADER_METHOD]: authority.method,
      [HTTP2_HEADER_PATH]: authority.path
    });
  }

  _omitPseudoHeaders(resHeaders) {
    return _.reduce(resHeaders, (result, value, name) => {
      if (!_.startsWith(name, ':')) {
        result[name] = value;
      }
      return result;
    }, {});
  }

  finalize() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.finalized = true;
  }
}

module.exports = NSendRequest2;
