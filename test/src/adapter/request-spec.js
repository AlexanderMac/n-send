const _          = require('lodash');
const http       = require('http');
const https      = require('https');
const stream     = require('stream');
const sinon      = require('sinon');
const should     = require('should');
const nassert    = require('n-assert');
const Request    = require('../../../src/adapter/request');
const NSendError = require('../../../src/error');

describe('adapter / request', () => {
  function getInstance(opts = {}) {
    return new Request(opts);
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

      let opts = { data: 'opts' };
      let actual = Request.performRequest(opts);

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

    function test({ reqAbortArgs, reqEndArgs, resolveArgs, rejectArgs }) {
      let instance = getInstance({
        reqOpts: 'reqOpts',
        resolve: () => {},
        reject: () => {}
      });
      instance.processResponse = () => {};
      sinon.stub(instance, '_transformRequestData').returns('some-data');
      sinon.stub(instance, '_getTransport').returns(fakeTransport);
      sinon.stub(instance, 'resolve');
      sinon.stub(instance, 'reject');

      let actual = instance.performRequest();

      let expected = fakeReq;
      nassert.assert(actual, expected);
      nassert.assertFn({ inst: instance, fnName: '_transformRequestData', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: instance, fnName: '_getTransport', expectedArgs: '_without-args_' });

      nassert.assertFn({ inst: fakeTransport, fnName: 'request', expectedMultipleArgs: ['reqOpts', instance.processResponse] });
      nassert.assertFn({ inst: fakeReq, fnName: 'on', expectedMultipleArgs: ['error', () => {}] });
      nassert.assertFn({ inst: fakeReq, fnName: 'abort', expectedArgs: reqAbortArgs });
      nassert.assertFn({ inst: fakeReq, fnName: 'end', expectedArgs: reqEndArgs });

      nassert.assertFn({ inst: instance, fnName: 'resolve', expectedArgs: resolveArgs });
      nassert.assertFn({ inst: instance, fnName: 'reject', expectedArgs: rejectArgs });
    }

    it('should TODO', () => {
      let reqEndArgs = 'some-data';

      test({ reqEndArgs });
    });
  });

  describe('_getTransport', () => {
    it('should return http when protocol is `http`', () => {
      let instance = getInstance({
        reqOpts: { protocol: 'http:' }
      });

      let transport = instance._getTransport();

      nassert.assert(transport === http, true);
    });

    it('should return https when protocol is `https`', () => {
      let instance = getInstance({
        reqOpts: { protocol: 'https:' }
      });

      let transport = instance._getTransport();

      nassert.assert(transport === https, true);
    });
  });

  describe('_transformRequestData', () => {
    function getDefReqOpts() {
      return {
        headers: {
          'content-encoding': 'utf8'
        }
      };
    }

    it('should return undefined when data is undefined', () => {
      let instance = getInstance({
        reqOpts: getDefReqOpts()
      });

      let actual = instance._transformRequestData();

      let expected = {
        headers: {
          'content-encoding': 'utf8'
        }
      };
      nassert.assert(instance.reqOpts.headers, expected.headers);
      nassert.assert(actual, expected.data);
    });

    it('should return unchanged stream when data is Stream', () => {
      let instance = getInstance({
        reqOpts: getDefReqOpts(),
        data: new stream.Readable()
      });

      let actual = instance._transformRequestData();

      let expected = {
        data: instance.data,
        headers: {
          'content-encoding': 'utf8'
        }
      };
      nassert.assert(instance.reqOpts.headers, expected.headers);
      nassert.assert(actual === instance.data, true);
    });

    it('should set headers.contentLength and return unchanged buffer when data is Buffer', () => {
      let instance = getInstance({
        reqOpts: getDefReqOpts(),
        data: Buffer.from('some-data', 'utf8')
      });

      let actual = instance._transformRequestData();

      let expected = {
        data: instance.data,
        headers: {
          'content-encoding': 'utf8',
          'content-length': 9
        }
      };
      nassert.assert(instance.reqOpts.headers, expected.headers);
      nassert.assert(actual === instance.data, true);
    });

    it('should set headers.contentLength and return buffer when data is String', () => {
      let instance = getInstance({
        reqOpts: getDefReqOpts(),
        data: 'some-string-data'
      });

      let actual = instance._transformRequestData();

      let expected = {
        data: instance.data,
        headers: {
          'content-encoding': 'utf8',
          'content-length': 16
        }
      };
      nassert.assert(instance.reqOpts.headers, expected.headers);
      nassert.assert(_.isBuffer(actual), true);
      nassert.assert(actual.toString(), 'some-string-data');
    });

    it('should set headers.contentLength and return buffer when data is Object', () => {
      let instance = getInstance({
        reqOpts: getDefReqOpts(),
        data: {
          name: 'John'
        }
      });

      let actual = instance._transformRequestData();

      let expected = {
        data: instance.data,
        headers: {
          'content-encoding': 'utf8',
          'content-length': 15
        }
      };
      nassert.assert(instance.reqOpts.headers, expected.headers);
      nassert.assert(_.isBuffer(actual), true);
      nassert.assert(actual.toString(), '{"name":"John"}');
    });

    it('should throw error when data type is not supported', () => {
      let instance = getInstance({
        reqOpts: getDefReqOpts(),
        data: 15
      });

      let expected = new NSendError('Data must be Stream, Buffer, Object or String');
      should(instance._transformRequestData.bind(instance)).throw(expected);
    });
  });
});
