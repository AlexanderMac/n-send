const _ = require('lodash');
const http2 = require('http2');
const checks = require('../utils/checks');
const NSendError = require('../error');

const {
  HTTP2_HEADER_CONTENT_LENGTH
} = http2.constants;

exports.transformRequestData = (data, headers) => {
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
  headers[HTTP2_HEADER_CONTENT_LENGTH] = data.length;

  return data;
};

exports.transformResponseData = (data, responseType) => {
  if (responseType === 'json') {
    let parsedData = _.attempt(JSON.parse.bind(null, data));
    if (!_.isError(parsedData)) {
      return parsedData;
    }
  }
  return data;
};
