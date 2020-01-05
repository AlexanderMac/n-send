const _ = require('lodash');
const sinon = require('sinon');
const nassert = require('n-assert');
const RequestOptionsBuilder = require('../../../src/adapter/request-options-builder');

describe('adapter / request-options-builder', () => {
  function getInstance(options = {}) {
    return new RequestOptionsBuilder(options);
  }

  describe('static build', () => {
    beforeEach(() => {
      sinon.stub(RequestOptionsBuilder.prototype, 'build');
    });

    afterEach(() => {
      RequestOptionsBuilder.prototype.build.restore();
    });

    it('should create an instance of RequestOptionsBuilder and call build function', () => {
      let builtOptions = 'options';
      RequestOptionsBuilder.prototype.build.returns(builtOptions);

      let options = { data: 'options' };
      let actual = RequestOptionsBuilder.build(options);

      let expected = builtOptions;
      nassert.assert(actual, expected);
      nassert.assertFn({ inst: RequestOptionsBuilder.prototype, fnName: 'build', expectedArgs: '_without-args_' });
    });
  });

  describe('build', () => {
    it('should call internal functions and return built options', () => {
      let builtOptions = 'options';
      let instance = getInstance();
      sinon.stub(instance, '_parseUrl');
      sinon.stub(instance, '_parseParams');
      sinon.stub(instance, '_parseAuth');
      sinon.stub(instance, '_parseProxy');
      sinon.stub(instance, '_buildOptions').returns(builtOptions);

      let actual = instance.build();

      let expected = builtOptions;
      nassert.assert(actual, expected);
      nassert.assertFn({ inst: instance, fnName: '_parseUrl', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: instance, fnName: '_parseParams', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: instance, fnName: '_parseAuth', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: instance, fnName: '_parseProxy', expectedArgs: '_without-args_' });
      nassert.assertFn({ inst: instance, fnName: '_buildOptions', expectedArgs: '_without-args_' });
    });
  });

  describe('_parseUrl', () => {
    function getDefExpected(ex) {
      return _.extend({
        protocol: 'http:',
        host: 'someapi.com',
        port: '',
        username: '',
        password: '',
        path: '/users'
      }, ex);
    }

    it('should parse absolute url', () => {
      let instance = getInstance({
        url: 'http://someapi.com/users'
      });

      instance._parseUrl();

      let expected = getDefExpected();
      nassert.assert(instance, expected);
    });

    it('should parse absolute url with auth', () => {
      let instance = getInstance({
        url: 'http://admin:pass@someapi.com/users'
      });

      instance._parseUrl();

      let expected = getDefExpected({
        username: 'admin',
        password: 'pass'
      });
      nassert.assert(instance, expected);
    });

    it('should parse absolute url with query', () => {
      let instance = getInstance({
        url: 'http://someapi.com/users?name=john'
      });

      instance._parseUrl();

      let expected = getDefExpected({
        path: '/users?name=john'
      });
      nassert.assert(instance, expected);
    });

    it('should parse relative and base urls', () => {
      let instance = getInstance({
        baseUrl: 'https://someapi.com:8080',
        url: '/users'
      });

      instance._parseUrl();

      let expected = getDefExpected({
        protocol: 'https:',
        host: 'someapi.com',
        port: '8080'
      });
      nassert.assert(instance, expected);
    });
  });

  describe('_parseParams', () => {
    it('should return when params are not defined', () => {
      let instance = getInstance();
      instance.path = '/users';

      instance._parseParams();

      let expected = '/users';
      nassert.assert(instance.path, expected);
    });

    it('should parse params when they are defined (path does not contain query)', () => {
      let instance = getInstance({
        params: {
          ts: 12312312312312,
          token: 'asjgljkqwkehqjw'
        }
      });
      instance.path = '/users';

      instance._parseParams();

      let expected = '/users?ts=12312312312312&token=asjgljkqwkehqjw';
      nassert.assert(instance.path, expected);
    });

    it('should parse params when they are defined (path contains query)', () => {
      let instance = getInstance({
        params: {
          token: 'asjgljkqwkehqjw'
        }
      });
      instance.path = '/users?ts=12312312312312';

      instance._parseParams();

      let expected = '/users?ts=12312312312312&token=asjgljkqwkehqjw';
      nassert.assert(instance.path, expected);
    });
  });

  describe('_parseAuth', () => {
    it('should return when auth, username and password are not defined', () => {
      let instance = getInstance({
        headers: {
          authorization: 'auth'
        }
      });

      instance._parseAuth();

      let expected = {
        headers: {
          authorization: 'auth'
        }
      };
      nassert.assert(instance.auth, expected.auth);
      nassert.assert(instance.inputHeaders, expected.headers);
    });

    it('should generate instance.auth when auth is defined', () => {
      let instance = getInstance({
        auth: {
          username: 'admin',
          password: 'pass'
        },
        headers: {
          authorization: 'auth'
        }
      });

      instance._parseAuth();

      let expected = {
        auth: 'admin:pass',
        headers: {}
      };
      nassert.assert(instance.auth, expected.auth);
      nassert.assert(instance.inputHeaders, expected.headers);
    });

    it('should generate instance.auth when auth is not defined, but there are instance.username and instance.password', () => {
      let instance = getInstance({
        headers: {
          authorization: 'auth'
        }
      });
      instance.username = 'admin';
      instance.password = 'pass';

      instance._parseAuth();

      let expected = {
        auth: 'admin:pass',
        headers: {}
      };
      nassert.assert(instance.auth, expected.auth);
      nassert.assert(instance.inputHeaders, expected.headers);
    });
  });

  describe('_parseProxy', () => {
    it('should parse proxy', () => {
      let instance = getInstance();
      instance._parseProxy();
    });
  });

  describe('_buildOptions', () => {
    it('should build options using instance fields', () => {
      let instance = getInstance();
      instance.protocol = 'protocol';
      instance.inputMethod = 'method';
      instance.host = 'host';
      instance.port = 'port';
      instance.path = 'path';
      instance.auth = 'auth';
      instance.inputHeaders = 'headers';

      let actual = instance._buildOptions();

      let expected = {
        protocol: 'protocol',
        method: 'method',
        host: 'host',
        port: 'port',
        path: 'path',
        auth: 'auth',
        headers: 'headers'
      };
      nassert.assert(actual, expected);
    });
  });
});
