const _ = require('lodash')

function isBuffer(val) {
  return _.isBuffer(val)
}

function isNil(val) {
  return _.isNil(val)
}

function isObject(val) {
  return _.isObject(val)
}

function isStream(val) {
  return isObject(val) && _.isFunction(val.pipe)
}

function isString(val) {
  return _.isString(val)
}

module.exports = {
  isBuffer,
  isNil,
  isObject,
  isStream,
  isString
}
