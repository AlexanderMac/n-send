const sinon = require('sinon');
const nassert = require('n-assert');
const Response = require('../../../../src/adapter/http1/response');

describe('adapter / http1 / response', () => {
  function getInstance(opts = {}) {
    return new Response(opts);
  }

  describe('static processResponse', () => {
    beforeEach(() => {
      sinon.stub(Response.prototype, 'processResponse');
    });

    afterEach(() => {
      Response.prototype.processResponse.restore();
    });

    it('should create an instance of Response and call processResponse function', () => {
      let res = 'res';
      Response.prototype.processResponse.returns(res);

      let opts = { data: 'opts' };
      let actual = Response.processResponse(opts);

      let expected = res;
      nassert.assert(actual, expected);
      nassert.assertFn({ inst: Response.prototype, fnName: 'processResponse', expectedArgs: '_without-args_' });
    });
  });

  describe('_transformResponseData', () => {
    it('should transform response data', () => {
      let instance = getInstance();

      let actual = instance._transformResponseData('some-data');

      let expected = 'some-data';
      nassert.assert(actual, expected);
    });
  });
});
