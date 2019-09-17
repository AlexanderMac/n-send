const _       = require('lodash');
const sinon   = require('sinon');
const nassert = require('n-assert');
const Core    = require('../../../src/core');
const adapter = require('../../../src/adapter');

describe('core / main', () => {
  function getInstance() {
    return new Core();
  }

  describe('static getInstance', () => {
    it('should create and return an instance of Core', () => {
      let opts = { data: 'opts' };
      let actual = Core.getInstance(opts);

      let expected = {};
      nassert.assert(actual, expected);
    });
  });

  describe('static send', () => {
    before(() => {
      sinon.stub(Core.prototype, 'send');
    });

    after(() => {
      Core.prototype.send.restore();
    });

    it('should create an instance of Core and call instance.send', async () => {
      let opts = { data: 'opts' };
      Core.prototype.send.resolves('res');

      let actual = await Core.send(opts);

      let expected = 'res';
      nassert.assert(actual, expected);
      nassert.assertFn({ inst: Core.prototype, fnName: 'send', expectedArgs: opts });
    });
  });

  describe('send', () => {
    before(() => {
      sinon.stub(adapter, 'performRequest');
    });

    after(() => {
      adapter.performRequest.restore();
    });

    it('should merge and validate options, perform request', async () => {
      let opts = { data: 'opts' };
      let instance = getInstance();
      _.extend(instance, opts);
      sinon.stub(instance, '_mergeOpts');
      sinon.stub(instance, '_validateOpts');

      let res = 'res';
      adapter.performRequest.resolves(res);

      let actual = await instance.send(opts);

      let expected = res;
      nassert.assert(actual, expected);

      nassert.assertFn({ inst: instance, fnName: '_mergeOpts', expectedArgs: opts });
      nassert.assertFn({ inst: instance, fnName: '_validateOpts', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: adapter, fnName: 'performRequest', expectedArgs: opts });
    });
  });

  describe('_mergeOpts', () => {
    it('should merge opts with default when only required params (url) are provided', () => {
      let opts = {
        url: 'https://example.com/users'
      };
      let instance = getInstance();
      instance._mergeOpts(opts);

      let expected = {
        method: 'get',
        url: 'https://example.com/users',
        maxContentLength: 10000,
        maxRedirects: 0,
        responseType: 'text',
        responseEncoding: 'utf8'
      };
      nassert.assert(instance, expected);
    });

    it('should merge opts with default when many options are provided', () => {
      let opts = {
        method: 'POST',
        baseUrl: 'https://example.com',
        url: '/users',
        params: {
          ts: 1857295727634
        },
        auth: {
          username: 'john',
          password: 'pass'
        },
        headers: {
          'content-Type': 'text/plain',
          Connection: 'keep-alive'
        },
        timeout: 5000,
        maxContentLength: 25000,
        maxRedirects: 25,
        responseType: 'text',
        responseEncoding: 'utf8',
        data: 'somedata'
      };
      let instance = getInstance();
      instance._mergeOpts(opts);

      let expected = _.chain(opts)
        .cloneDeep()
        .extend({
          method: 'post',
          headers: {
            'content-type': 'text/plain',
            connection: 'keep-alive'
          }
        })
        .value();
      nassert.assert(instance, expected);
    });
  });

  describe('_validateOpts', () => {
    it('should validate opts', () => {
      let instance = getInstance();
      instance._validateOpts();
    });
  });
});
