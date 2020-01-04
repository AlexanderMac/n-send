const _ = require('lodash');
const sinon = require('sinon');
const nassert = require('n-assert');
const Adapter = require('../../../src/adapter');
const request = require('../../../src/adapter/http1/request');
const response = require('../../../src/adapter/http1/response');
const reqOptionsBuilder = require('../../../src/adapter/request-options-builder');

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
    it('should return promise, call internal _performRequest and _cleanup (resolve case)', async () => {
      let res = 'res';
      let instance = getInstance();
      sinon.stub(instance, '_performRequest').callsFake(() => instance.resolve(res));
      sinon.stub(instance, '_cleanup');

      let actual = await instance.performRequest();

      let expected = res;
      nassert.assert(actual, expected);
      nassert.assertFn({ inst: instance, fnName: '_performRequest', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: instance, fnName: '_cleanup', expectedArgs: '_without-args_' });
    });

    it('should return promise, call internal _performRequest and _cleanup (reject case)', async () => {
      let res = new Error('Some error');
      let instance = getInstance();
      sinon.stub(instance, '_performRequest').callsFake(() => instance.reject(res));
      sinon.stub(instance, '_cleanup');

      try {
        await instance.performRequest();
      } catch (err) {
        nassert.assert(err, res);
      }

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

    it('should build req options and call request.performRequest', () => {
      let instance = getInstance();
      instance.options = {
        data: 'somedata'
      };
      instance.resolve = () => {};
      instance.reject = () => {};
      sinon.stub(instance, '_createOptions').callsFake(() => ({ protocol: 'http' }));
      sinon.stub(instance, '_getReqOptions').callsFake(() => 'reqOptions');
      request.performRequest.returns('req');

      let options = {
        reqOptions: 'reqOptions',
        protocol: 'http',
        data: 'somedata',
        resolve: instance.resolve,
        reject: instance.reject,
        processResponse: instance._processResponse.bind(instance)
      };

      instance._performRequest();

      nassert.assert(instance.req, 'req');
      nassert.assertFn({ inst: instance, fnName: '_createOptions', expectedArgs: ['protocol', 'timeout'] });
      nassert.assertFn({ inst: instance, fnName: '_getReqOptions', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: request, fnName: 'performRequest', expectedArgs: options });
    });
  });

  describe('_processResponse', () => {
    before(() => {
      sinon.stub(response, 'processResponse');
    });

    after(() => {
      response.processResponse.restore();
    });

    it('should build res options and call response.processResponse', () => {
      let instance = getInstance();
      instance.options = {};
      instance.req = 'req';
      instance.resolve = () => {};
      instance.reject = () => {};
      sinon.stub(instance, '_createOptions').callsFake(() => ({ responseType: 'text', responseEncoding: 'utf8' }));

      let res = 'res';
      let options = {
        req: 'req',
        res: 'res',
        responseType: 'text',
        responseEncoding: 'utf8',
        resolve: instance.resolve,
        reject: instance.reject
      };

      instance._processResponse(res);

      nassert.assertFn({ inst: instance, fnName: '_createOptions', expectedArgs: ['maxContentLength', 'responseType', 'responseEncoding'] });
      nassert.assertFn({ inst: response, fnName: 'processResponse', expectedArgs: options });
    });
  });

  describe('_createOptions', () => {
    it('should clone and return requested options', () => {
      let instance = getInstance();
      instance.options = {
        method: 'POST',
        baseUrl: 'https://example.com',
        url: '/users',
        timeout: 5000,
        maxContentLength: 25000,
        maxRedirects: 25,
        responseType: 'text',
        responseEncoding: 'utf8',
        data: 'somedata'
      };

      let pickOptions = ['maxContentLength', 'responseType', 'responseEncoding'];
      let actual = instance._createOptions(pickOptions);

      let expected = {
        maxContentLength: 25000,
        responseType: 'text',
        responseEncoding: 'utf8'
      };
      nassert.assert(actual, expected);
    });
  });

  describe('_getReqOptions', () => {
    before(() => {
      sinon.stub(reqOptionsBuilder, 'build');
    });

    after(() => {
      reqOptionsBuilder.build.restore();
    });

    it('should call reqOptionsBuilder.build and return result', () => {
      let instance = getInstance();
      instance.options = {
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

      let params = _.pick(instance.options, ['method', 'baseUrl', 'url', 'params', 'auth', 'headers']);
      reqOptionsBuilder.build.returns('reqOptions');

      let actual = instance._getReqOptions();

      nassert.assert(actual, 'reqOptions');
      nassert.assertFn({ inst: reqOptionsBuilder, fnName: 'build', expectedArgs: params });
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
