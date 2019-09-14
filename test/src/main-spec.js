const _       = require('lodash');
const nassert = require('n-assert');
const nsend   = require('../../');

describe('main', () => {
  it ('should export public interfaces', () => {
    nassert.assert(_.isFunction(nsend), true);
    nassert.assert(_.isFunction(nsend.NSend), true);
    nassert.assert(_.isFunction(nsend.getInstance), true);
  });
});
