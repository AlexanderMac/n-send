const _ = require('lodash');
const sinon = require('sinon');
const nassert = require('n-assert');
const Adapter = require('../../../src/adapter');
const request = require('../../../src/adapter/http1/request');
const response = require('../../../src/adapter/http1/response');
const reqOptsBuilder = require('../../../src/adapter/request-options-builder');

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

      let opts = { data: 'opts' };
      let actual = Adapter.performRequest(opts);

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
      instance.opts = {
        data: 'somedata'
      };
      instance.resolve = () => {};
      instance.reject = () => {};
      sinon.stub(instance, '_getOpts').callsFake(() => ({ protocol: 'http' }));
      sinon.stub(instance, '_getReqOpts').callsFake(() => 'reqOpts');
      request.performRequest.returns('req');

      let opts = {
        reqOpts: 'reqOpts',
        protocol: 'http',
        data: 'somedata',
        resolve: instance.resolve,
        reject: instance.reject,
        processResponse: instance._processResponse.bind(instance)
      };

      instance._performRequest();

      nassert.assert(instance.req, 'req');
      nassert.assertFn({ inst: instance, fnName: '_getOpts', expectedArgs: ['protocol', 'timeout'] });
      nassert.assertFn({ inst: instance, fnName: '_getReqOpts', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: request, fnName: 'performRequest', expectedArgs: opts });
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
      instance.opts = {};
      instance.req = 'req';
      instance.resolve = () => {};
      instance.reject = () => {};
      sinon.stub(instance, '_getOpts').callsFake(() => ({ responseType: 'text', responseEncoding: 'utf8' }));

      let res = 'res';
      let opts = {
        req: 'req',
        res: 'res',
        responseType: 'text',
        responseEncoding: 'utf8',
        resolve: instance.resolve,
        reject: instance.reject
      };

      instance._processResponse(res);

      nassert.assertFn({ inst: instance, fnName: '_getOpts', expectedArgs: ['maxContentLength', 'responseType', 'responseEncoding'] });
      nassert.assertFn({ inst: response, fnName: 'processResponse', expectedArgs: opts });
    });
  });

  describe('_getOpts', () => {
    it('should clone and return requested options', () => {
      let instance = getInstance();
      instance.opts = {
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

      let pickOpts = ['maxContentLength', 'responseType', 'responseEncoding'];
      let actual = instance._getOpts(pickOpts);

      let expected = {
        maxContentLength: 25000,
        responseType: 'text',
        responseEncoding: 'utf8'
      };
      nassert.assert(actual, expected);
    });
  });

  describe('_getReqOpts', () => {
    before(() => {
      sinon.stub(reqOptsBuilder, 'build');
    });

    after(() => {
      reqOptsBuilder.build.restore();
    });

    it('should call reqOptsBuilder.build and return result', () => {
      let instance = getInstance();
      instance.opts = {
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

      let params = _.pick(instance.opts, ['method', 'baseUrl', 'url', 'params', 'auth', 'headers']);
      reqOptsBuilder.build.returns('reqOpts');

      let actual = instance._getReqOpts();

      nassert.assert(actual, 'reqOpts');
      nassert.assertFn({ inst: reqOptsBuilder, fnName: 'build', expectedArgs: params });
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
