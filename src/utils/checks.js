const _ = require('lodash');

function isArrayBuffer(val) {
  return _.isArrayBuffer(val);
}

function isArrayBufferView(val) {
  if (ArrayBuffer.isView) {
    return ArrayBuffer.isView(val);
  }
  return val && val.buffer && val.buffer instanceof ArrayBuffer;
}

function isBlob(val) {
  return _.isBlob(val);
}

function isBuffer(val) {
  return _.isBuffer(val);
}

function isFile(val) {
  return _.toString(val) === '[object File]';
}

function isNil(val) {
  return _.isNil(val);
}

function isObject(val) {
  return _.isObject(val);
}

function isStream(val) {
  return isObject(val) && _.isFunction(val.pipe);
}

function isString(val) {
  return _.isString(val);
}

function isURLSearchParams(val) {
  return val instanceof URLSearchParams;
}

module.exports = {
  isArrayBuffer,
  isArrayBufferView,
  isBlob,
  isBuffer,
  isFile,
  isNil,
  isObject,
  isStream,
  isString,
  isURLSearchParams
};
