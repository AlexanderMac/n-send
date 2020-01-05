const http = require('http');
const https = require('https');
const sinon = require('sinon');
const nassert = require('n-assert');
const Request = require('../../../../src/adapter/http1/request');
const Response = require('../../../../src/adapter/http1/response');

describe('adapter / http1 / request', () => {
  function getInstance(options = {}) {
    return new Request(options);
  }

  describe('static performRequest', () => {
    beforeEach(() => {
      sinon.stub(Request.prototype, 'performRequest');
    });

    afterEach(() => {
      Request.prototype.performRequest.restore();
    });

    it('should create an instance of Request and call performRequest function', () => {
      let req = 'req';
      Request.prototype.performRequest.returns(req);

      let options = { data: 'options' };
      let actual = Request.performRequest(options);
      let expected = req;

      nassert.assert(actual, expected);
      nassert.assertFn({ inst: Request.prototype, fnName: 'performRequest', expectedArgs: '_without-args_' });
    });
  });

  describe.skip('performRequest', () => {
    // TODO: implement it
  });

  describe('_getTransport', () => {
    it('should return http when protocol is `http`', () => {
      let instance = getInstance();
      let protocol = 'http:';

      let transport = instance._getTransport(protocol);

      nassert.assert(transport === http, true);
    });

    it('should return https when protocol is `https`', () => {
      let instance = getInstance();
      let protocol = 'https:';

      let transport = instance._getTransport(protocol);

      nassert.assert(transport === https, true);
    });
  });

  describe('_processResponse', () => {
    beforeEach(() => {
      sinon.stub(Response, 'processResponse');
    });

    afterEach(() => {
      Response.processResponse.restore();
    });

    it('should build response options and call response.processResponse', () => {
      let instance = getInstance({
        maxContentLength: 5000,
        responseType: 'json',
        responseEncoding: 'utf16'
      });
      instance.req = { data: 'reqData' };
      instance.done = 'doneFn';
      let res = {
        data: 'resData'
      };

      instance._processResponse(res);
      let expected = {
        maxContentLength: 5000,
        responseType: 'json',
        responseEncoding: 'utf16',
        done: instance.done,
        req: instance.req,
        res
      };

      nassert.assertFn({ inst: Response, fnName: 'processResponse', expectedArgs: expected });
    });
  });

  describe('finalize', () => {
    it('should set finilized to true only when timer is defined', () => {
      let instance = getInstance();

      instance.finalize();

      nassert.assert(instance.timer, undefined);
      nassert.assert(instance.finalized, true);
    });

    it('should set finilized to true and clear timer when it is defined', () => {
      let instance = getInstance();
      instance.timer = 'timer';

      instance.finalize();

      nassert.assert(instance.timer, null);
      nassert.assert(instance.finalized, true);
    });
  });
});
