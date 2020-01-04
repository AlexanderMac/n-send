const _ = require('lodash');
const sinon = require('sinon');
const nassert = require('n-assert');
const Core = require('../../../src/core');
const adapter = require('../../../src/adapter');

describe('core / main', () => {
  function getInstance() {
    return new Core();
  }

  describe('static getInstance', () => {
    it('should create and return an instance of Core', () => {
      let options = { data: 'options' };
      let actual = Core.getInstance(options);

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
      let options = { data: 'options' };
      Core.prototype.send.resolves('res');

      let actual = await Core.send(options);

      let expected = 'res';
      nassert.assert(actual, expected);
      nassert.assertFn({ inst: Core.prototype, fnName: 'send', expectedArgs: options });
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
      let options = { data: 'options' };
      let instance = getInstance();
      _.extend(instance, options);
      sinon.stub(instance, '_mergeOptions');
      sinon.stub(instance, '_validateOptions');

      let res = {
        headers: {}
      };
      adapter.performRequest.resolves(res);

      let actual = await instance.send(options);

      let expected = res;
      nassert.assert(actual, expected);

      nassert.assertFn({ inst: instance, fnName: '_mergeOptions', expectedArgs: options });
      nassert.assertFn({ inst: instance, fnName: '_validateOptions', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: adapter, fnName: 'performRequest', expectedArgs: options });
    });
  });

  describe('_mergeOptions', () => {
    it('should merge options with default when only required params (url) are provided', () => {
      let options = {
        url: 'https://example.com/users'
      };
      let instance = getInstance();
      instance._mergeOptions(options);

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

    it('should merge options with default when many options are provided', () => {
      let options = {
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
      instance._mergeOptions(options);

      let expected = _.chain(options)
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

  describe('_validateOptions', () => {
    it('should validate options', () => {
      let instance = getInstance();
      instance._validateOptions();
    });
  });
});
