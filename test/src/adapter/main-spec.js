const sinon = require('sinon');
const nassert = require('n-assert');
const Adapter = require('../../../src/adapter');
const request = require('../../../src/adapter/http1/request');

describe('adapter / main', () => {
  function getInstance() {
    return new Adapter();
  }

  describe('static performRequest', () => {
    beforeEach(() => {
      sinon.stub(Adapter.prototype, 'performRequest');
    });

    afterEach(() => {
      Adapter.prototype.performRequest.restore();
    });

    it('should create an instance of Adapter and call performRequest function', () => {
      let res = 'res';
      Adapter.prototype.performRequest.returns(res);

      let options = { data: 'options' };
      let actual = Adapter.performRequest(options);
      let expected = res;

      nassert.assert(actual, expected);
      nassert.assertFn({ inst: Adapter.prototype, fnName: 'performRequest', expectedArgs: '_without-args_' });
    });
  });

  describe('performRequest', () => {
    it('should return promise, call internal _performRequest and _cleanup', async () => {
      let instance = getInstance();
      sinon.stub(instance, '_performRequest').callsFake(() => instance.done());
      sinon.stub(instance, '_cleanup');

      await instance.performRequest();

      nassert.assertFn({ inst: instance, fnName: '_performRequest', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: instance, fnName: '_cleanup', expectedArgs: '_without-args_' });
    });
  });

  describe('_performRequest', () => {
    before(() => {
      sinon.stub(request, 'performRequest');
    });

    after(() => {
      request.performRequest.restore();
    });

    it('should build request options and call request.performRequest', () => {
      let instance = getInstance();
      instance.options = {
        method: 'post',
        url: 'https://example.com',
        timeout: 5000,
        maxContentLength: 25000,
        responseType: 'text',
        responseEncoding: 'utf16'
      };
      let reqOptions = {
        method: 'post',
        url: 'https://example.com',
        timeout: 5000,
        maxContentLength: 25000,
        responseType: 'text',
        responseEncoding: 'utf16',
        done: instance.done
      };

      request.performRequest.returns('req');

      instance._performRequest();
      let expected = 'req';

      nassert.assert(instance.req, expected);
      nassert.assertFn({ inst: request, fnName: 'performRequest', expectedArgs: reqOptions });
    });
  });

  describe('_cleanup', () => {
    it('should do nothing when instance.req is undefined', () => {
      let instance = getInstance();

      instance._cleanup();
    });

    it('should call req.finalize when instance.req is defined', () => {
      let instance = getInstance();
      instance.req = {
        finalize: () => {}
      };

      instance._cleanup();

      nassert.assert(instance.req, null);
    });
  });
});
