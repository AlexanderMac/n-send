const _ = require('lodash');
const sinon = require('sinon');
const nassert = require('n-assert');
const Core = require('../../../src/core');
const methodAliases = require('../../../src/core/method-aliases');

describe('core / method-aliases', () => {
  describe('extend', () => {
    describe('should call nsend.send and provide the correct params for each http-method', () => {
      before(() => {
        sinon.stub(Core, 'send');
      });

      afterEach(() => {
        Core.send.reset();
      });

      after(() => {
        Core.send.restore();
      });

      function test(method) {
        let nsend = {};

        methodAliases.extend(nsend);

        let url = 'example.com';
        let data = 'some data';
        let opts = { headers: 'some headers' };
        if (_.includes(['get', 'head', 'options', 'delete'], method)) {
          nsend[method](url, opts);
        } else {
          nsend[method](url, data, opts);
        }

        let expectedArgs = {
          method,
          url: 'example.com',
          headers: 'some headers'
        };
        if (_.includes(['post', 'put', 'patch'], method)) {
          expectedArgs.data = data;
        }
        nassert.assertFn({ inst: Core, fnName: 'send', expectedArgs });
      }

      it('get', () => test('get'));
      it('head', () => test('head'));
      it('options', () => test('options'));
      it('delete', () => test('delete'));
      it('post', () => test('post'));
      it('put', () => test('put'));
      it('patch', () => test('patch'));
    });
  });
});
