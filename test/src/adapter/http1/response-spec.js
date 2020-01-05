const sinon = require('sinon');
const nassert = require('n-assert');
const Response = require('../../../../src/adapter/http1/response');

describe('adapter / http1 / response', () => {
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

      let options = { data: 'options' };
      let actual = Response.processResponse(options);

      let expected = res;
      nassert.assert(actual, expected);
      nassert.assertFn({ inst: Response.prototype, fnName: 'processResponse', expectedArgs: '_without-args_' });
    });
  });
});
