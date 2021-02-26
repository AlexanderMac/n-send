const sinon = require('sinon')
const nassert = require('n-assert')
const Request = require('../../../../src/adapter/http2/request')

describe('adapter / http2 / request', () => {
  function getInstance(options = {}) {
    return new Request(options)
  }

  describe('static performRequest', () => {
    beforeEach(() => {
      sinon.stub(Request.prototype, 'performRequest')
    })

    afterEach(() => {
      Request.prototype.performRequest.restore()
    })

    it('should create an instance of Request and call performRequest function', () => {
      let req = 'req'
      Request.prototype.performRequest.returns(req)

      let options = { data: 'options' }
      let actual = Request.performRequest(options)
      let expected = req

      nassert.assert(actual, expected)
      nassert.assertFn({ inst: Request.prototype, fnName: 'performRequest', expectedArgs: '_without-args_' })
    })
  })

  describe.skip('performRequest', () => {
    // TODO: implement it
  })

  describe('_getOutgoingHeaders', () => {
    it('should return outgoing headers using authority', () => {
      let instance = getInstance()
      let authority = {
        method: 'get',
        path: '/features',
        headers: {
          'content-encoding': 'utf8'
        }
      }

      let actual = instance._getOutgoingHeaders(authority)
      let expected = {
        ':method': 'get',
        ':path': '/features',
        'content-encoding': 'utf8'
      }

      nassert.assert(actual, expected)
    })
  })

  describe('_omitPseudoHeaders', () => {
    it('should filter out pseudo-headers from response headers', () => {
      let instance = getInstance()
      let resHeaders = {
        ':status': 200,
        'content-encoding': 'utf8',
        'content-length': 150
      }

      let actual = instance._omitPseudoHeaders(resHeaders)
      let expected = {
        'content-encoding': 'utf8',
        'content-length': 150
      }

      nassert.assert(actual, expected)
    })
  })

  describe('finalize', () => {
    it('should set finilized to true only when timer is defined', () => {
      let instance = getInstance()

      instance.finalize()

      nassert.assert(instance.timer, undefined)
      nassert.assert(instance.finalized, true)
    })

    it('should set finilized to true and clear timer when it is defined', () => {
      let instance = getInstance()
      instance.timer = 'timer'

      instance.finalize()

      nassert.assert(instance.timer, null)
      nassert.assert(instance.finalized, true)
    })
  })
})
