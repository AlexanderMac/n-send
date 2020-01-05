const _ = require('lodash');
const http = require('http');
const https = require('https');
const stream = require('stream');
const sinon = require('sinon');
const should = require('should');
const nassert = require('n-assert');
const Request = require('../../../../src/adapter/http1/request');
const Response = require('../../../../src/adapter/http1/response');
const NSendError = require('../../../../src/error');

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
    let fakeReq = {
      on: () => {},
      abort: () => {},
      end: () => {}
    };

    let fakeTransport = {
      request: () => fakeReq
    };

    beforeEach(() => {
      sinon.stub(fakeTransport, 'request').returns(fakeReq);
      sinon.stub(fakeReq, 'on');
      sinon.stub(fakeReq, 'abort');
      sinon.stub(fakeReq, 'end');
    });

    afterEach(() => {
      fakeTransport.request.restore();
      fakeReq.on.restore();
      fakeReq.abort.restore();
      fakeReq.end.restore();
    });

    function test({ reqAbortArgs, reqEndArgs, doneArgs }) {
      let instance = getInstance({
        options: 'options',
        done: () => {}
      });
      instance.processResponse = () => {};
      sinon.stub(instance, '_transformRequestData').returns('some-data');
      sinon.stub(instance, '_getTransport').returns(fakeTransport);
      sinon.stub(instance, 'done');

      let actual = instance.performRequest();
      let expected = fakeReq;

      nassert.assert(actual, expected);
      nassert.assertFn({ inst: instance, fnName: '_transformRequestData', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: instance, fnName: '_getTransport', expectedArgs: '_without-args_' });

      nassert.assertFn({ inst: fakeTransport, fnName: 'request', expectedMultipleArgs: ['reqOptions', instance.processResponse] });
      nassert.assertFn({ inst: fakeReq, fnName: 'on', expectedMultipleArgs: ['error', () => {}] });
      nassert.assertFn({ inst: fakeReq, fnName: 'abort', expectedArgs: reqAbortArgs });
      nassert.assertFn({ inst: fakeReq, fnName: 'end', expectedArgs: reqEndArgs });
      nassert.assertFn({ inst: instance, fnName: 'done', expectedArgs: doneArgs });
    }

    it('should TODO', () => {
      test();
    });
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

  describe('_transformRequestData', () => {
    function getDefHeaders() {
      return {
        'content-encoding': 'utf8'
      };
    }

    it('should return undefined when data is undefined', () => {
      let instance = getInstance();
      let headers = getDefHeaders();
      let data = null;

      let actual = instance._transformRequestData(headers, data);
      let expected = {
        headers: {
          'content-encoding': 'utf8'
        }
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(actual, expected.data);
    });

    it('should return unchanged stream when data is Stream', () => {
      let instance = getInstance();
      let headers = getDefHeaders();
      let data = new stream.Readable();

      let actual = instance._transformRequestData(headers, data);
      let expected = {
        headers: {
          'content-encoding': 'utf8'
        },
        data
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(actual === data, true);
    });

    it('should set headers.contentLength and return unchanged buffer when data is Buffer', () => {
      let instance = getInstance();
      let headers = getDefHeaders();
      let data = Buffer.from('some-data', 'utf8');

      let actual = instance._transformRequestData(headers, data);
      let expected = {
        headers: {
          'content-encoding': 'utf8',
          'content-length': 9
        },
        data
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(actual === data, true);
    });

    it('should set headers.contentLength and return buffer when data is String', () => {
      let instance = getInstance();
      let headers = getDefHeaders();
      let data = 'some-string-data';

      let actual = instance._transformRequestData(headers, data);
      let expected = {
        headers: {
          'content-encoding': 'utf8',
          'content-length': 16
        },
        data
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(_.isBuffer(actual), true);
      nassert.assert(actual.toString(), 'some-string-data');
    });

    it('should set headers.contentLength and return buffer when data is Object', () => {
      let instance = getInstance();
      let headers = getDefHeaders();
      let data = {
        name: 'John'
      };

      let actual = instance._transformRequestData(headers, data);
      let expected = {
        data: instance.data,
        headers: {
          'content-encoding': 'utf8',
          'content-length': 15
        }
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(_.isBuffer(actual), true);
      nassert.assert(actual.toString(), '{"name":"John"}');
    });

    it('should throw error when data type is not supported', () => {
      let instance = getInstance();
      let headers = getDefHeaders();
      let data = 15;
      let expected = new NSendError('Data must be Stream, Buffer, Object or String');

      should(instance._transformRequestData.bind(instance, headers, data)).throw(expected);
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
