const sinon = require('sinon')
const nassert = require('n-assert')
const Adapter = require('../../../src/adapter')
const request1 = require('../../../src/adapter/http1/request')
const request2 = require('../../../src/adapter/http2/request')

describe('adapter / main', () => {
  function getInstance(options = {}) {
    return new Adapter(options)
  }

  describe('static performRequest', () => {
    beforeEach(() => {
      sinon.stub(Adapter.prototype, 'performRequest')
    })

    afterEach(() => {
      Adapter.prototype.performRequest.restore()
    })

    it('should create an instance of Adapter and call performRequest function', () => {
      let res = 'res'
      Adapter.prototype.performRequest.returns(res)

      let options = { data: 'options' }
      let actual = Adapter.performRequest(options)
      let expected = res

      nassert.assert(actual, expected)
      nassert.assertFn({ inst: Adapter.prototype, fnName: 'performRequest', expectedArgs: '_without-args_' })
    })
  })

  describe('performRequest', () => {
    beforeEach(() => {
      sinon.stub(request1, 'performRequest')
      sinon.stub(request2, 'performRequest')
    })

    afterEach(() => {
      request1.performRequest.restore()
      request2.performRequest.restore()
    })

    async function test({ protocolVersion, expected, request1Args, request2Args }) {
      let instance = getInstance({ protocolVersion })
      request1.performRequest.callsFake(() => {
        instance.done()
        return 'req1'
      })
      request2.performRequest.callsFake(() => {
        instance.done()
        return 'req2'
      })
      sinon.stub(instance, '_getRequestOptions').returns('reqOptions')
      sinon.stub(instance, '_cleanup')

      await instance.performRequest()

      nassert.assert(instance.req, expected)
      nassert.assertFn({ inst: request1, fnName: 'performRequest', expectedArgs: request1Args })
      nassert.assertFn({ inst: request2, fnName: 'performRequest', expectedArgs: request2Args })
      nassert.assertFn({ inst: instance, fnName: '_cleanup', expectedArgs: '_without-args_' })
    }

    it('should call request1.performRequest when protocolVersion is http/1.1', () => {
      let protocolVersion = 'http/1.1'
      let expected = 'req1'
      let request1Args = 'reqOptions'

      return test({ protocolVersion, expected, request1Args })
    })

    it('should call request2.performRequest when protocolVersion is http/2.0', () => {
      let protocolVersion = 'http/2.0'
      let expected = 'req2'
      let request2Args = 'reqOptions'

      return test({ protocolVersion, expected, request2Args })
    })
  })

  describe('_getRequestOptions', () => {
    it('should return request options', () => {
      let instance = getInstance()
      instance.options = {
        method: 'post',
        url: 'https://example.com',
        timeout: 5000,
        maxContentLength: 25000,
        responseType: 'text',
        responseEncoding: 'utf16'
      }

      let actual = instance._getRequestOptions()
      let expected = {
        method: 'post',
        url: 'https://example.com',
        timeout: 5000,
        maxContentLength: 25000,
        responseType: 'text',
        responseEncoding: 'utf16',
        done: instance.done
      }

      nassert.assert(actual, expected)
    })
  })

  describe('_cleanup', () => {
    it('should do nothing when instance.req is undefined', () => {
      let instance = getInstance()

      instance._cleanup()
    })

    it('should call req.finalize when instance.req is defined', () => {
      let instance = getInstance()
      instance.req = {
        finalize: () => {}
      }

      instance._cleanup()

      nassert.assert(instance.req, null)
    })
  })
})
