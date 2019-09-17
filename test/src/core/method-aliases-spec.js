const _             = require('lodash');
const sinon         = require('sinon');
const nassert       = require('n-assert');
const methodAliases = require('../../../src/core/method-aliases');

describe('core / method-aliases', () => {
  describe('extend', () => {
    function getInstance() {
      return {
        send: () => {}
      };
    }

    it('should extend instance by http methods', () => {
      let instance = getInstance();

      methodAliases.extend(instance);

      nassert.assert(_.isFunction(instance.get), true);
      nassert.assert(_.isFunction(instance.head), true);
      nassert.assert(_.isFunction(instance.options), true);
      nassert.assert(_.isFunction(instance.delete), true);
      nassert.assert(_.isFunction(instance.post), true);
      nassert.assert(_.isFunction(instance.put), true);
      nassert.assert(_.isFunction(instance.patch), true);
    });

    it('should call nsend.send and provide the correct params for each http-method', () => {
      function test(method) {
        let instance = getInstance();
        sinon.stub(instance, 'send');

        methodAliases.extend(instance);

        let url = 'example.com';
        let data = 'some data';
        let opts = { headers: 'some headers' };
        if (_.includes(['get', 'head', 'options', 'delete'], method)) {
          instance[method](url, opts);
        } else {
          instance[method](url, data, opts);
        }

        let expectedArgs = {
          method,
          url: 'example.com',
          headers: 'some headers'
        };
        if (_.includes(['post', 'put', 'patch'], method)) {
          expectedArgs.data = data;
        }
        nassert.assertFn({ inst: instance, fnName: 'send', expectedArgs });
      }

      let methods = [
        'get',
        'head',
        'options',
        'delete',
        'post',
        'put',
        'patch'
      ];
      _.each(methods, test);
    });
  });
});
