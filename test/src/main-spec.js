const _ = require('lodash');
const nassert = require('n-assert');
const nsend = require('../../');

describe('main', () => {
  it('should export public interfaces', () => {
    nassert.assert(_.isFunction(nsend), true);
    nassert.assert(_.isFunction(nsend.NSend), true);
  });

  it('should export http-method aliases', () => {
    nassert.assert(_.isFunction(nsend.get), true);
    nassert.assert(_.isFunction(nsend.head), true);
    nassert.assert(_.isFunction(nsend.options), true);
    nassert.assert(_.isFunction(nsend.delete), true);
    nassert.assert(_.isFunction(nsend.post), true);
    nassert.assert(_.isFunction(nsend.put), true);
    nassert.assert(_.isFunction(nsend.patch), true);
  });
});
