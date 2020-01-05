const _ = require('lodash');
const stream = require('stream');
const should = require('should');
const nassert = require('n-assert');
const NSendError = require('../../../src/error');
const dataTransformers = require('../../../src/adapter/data-transformers');

describe('adapter / data-transformers', () => {
  describe('transformRequestData', () => {
    function getDefHeaders() {
      return {
        'content-encoding': 'utf8'
      };
    }

    it('should return undefined when data is undefined', () => {
      let headers = getDefHeaders();
      let data = null;

      let actual = dataTransformers.transformRequestData(data, headers);
      let expected = {
        headers: {
          'content-encoding': 'utf8'
        }
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(actual, expected.data);
    });

    it('should return unchanged stream when data is Stream', () => {
      let headers = getDefHeaders();
      let data = new stream.Readable();

      let actual = dataTransformers.transformRequestData(data, headers);
      let expected = {
        headers: {
          'content-encoding': 'utf8'
        }
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(actual === data, true);
    });

    it('should set headers.contentLength and return unchanged buffer when data is Buffer', () => {
      let headers = getDefHeaders();
      let data = Buffer.from('some-data', 'utf8');

      let actual = dataTransformers.transformRequestData(data, headers);
      let expected = {
        headers: {
          'content-encoding': 'utf8',
          'content-length': 9
        }
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(actual === data, true);
    });

    it('should set headers.contentLength and return buffer when data is String', () => {
      let headers = getDefHeaders();
      let data = 'some-string-data';

      let actual = dataTransformers.transformRequestData(data, headers);
      let expected = {
        headers: {
          'content-encoding': 'utf8',
          'content-length': 16
        }
      };

      nassert.assert(headers, expected.headers);
      nassert.assert(_.isBuffer(actual), true);
      nassert.assert(actual.toString(), 'some-string-data');
    });

    it('should set headers.contentLength and return buffer when data is Object', () => {
      let headers = getDefHeaders();
      let data = {
        name: 'John'
      };

      let actual = dataTransformers.transformRequestData(data, headers);
      let expected = {
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
      let headers = getDefHeaders();
      let data = 15;
      let expected = new NSendError('Data must be Stream, Buffer, Object or String');

      should(dataTransformers.transformRequestData.bind(dataTransformers, data, headers)).throw(expected);
    });
  });

  describe('transformResponseData', () => {
    it('should return data as is when responseType is not json', () => {
      let data = 'some-data';
      let responseType = 'text';

      let actual = dataTransformers.transformResponseData(data, responseType);
      let expected = data;

      nassert.assert(actual, expected);
    });

    it('should return data as is when responseType is json, but it cannot be converted to object', () => {
      let data = 'incorrect-json-data';
      let responseType = 'json';

      let actual = dataTransformers.transformResponseData(data, responseType);
      let expected = data;

      nassert.assert(actual, expected);
    });

    it('should return data converted to object when responseType is json', () => {
      let data = '{"data":"some-data"}';
      let responseType = 'json';

      let actual = dataTransformers.transformResponseData(data, responseType);
      let expected = { data: 'some-data' };

      nassert.assert(actual, expected);
    });
  });
});
