const _ = require('lodash')
const consts = require('../consts')
const adapter = require('../adapter')
const NSendError = require('../error')

class NSendCore {
  static getInstance() {
    return new NSendCore()
  }

  static send(options) {
    let instance = new NSendCore()
    return instance.send(options)
  }

  async send(options) {
    this._mergeOptions(options)
    this._validateOptions()

    let res = await adapter.performRequest(this._getAdapterOptions())
    res = await this._followRedirects(res)
    res.redirects = this.redirects

    return res
  }

  _mergeOptions(options) {
    let defaults = _.cloneDeep(consts.DEFAULT_OPTIONS)
    let custom = _.chain(options)
      .pick(consts.CORE_OPTION_KEYS)
      .omit(['data'])
      .cloneDeep()
      .value()

    _.extend(this, defaults, custom)

    this.method = _.toLower(this.method)
    this.headers = _.reduce(this.headers, (result, value, name) => {
      result[_.toLower(name)] = value
      return result
    }, {})
    this.data = options.data
    this.redirectCount = 0
    this.redirects = []
  }

  _validateOptions() {
    // TODO: implement it
  }

  _getAdapterOptions() {
    return _.pick(this, consts.ADAPTER_OPTION_KEYS)
  }

  // eslint-disable-next-line max-statements
  async _followRedirects(res) {
    if (this.maxRedirects === 0) {
      return res
    }
    let location = res.headers.location
    if (!location || res.statusCode < 300 || res.statusCode >= 400) {
      return res
    }

    this.redirectCount++
    if (this.redirectCount > this.maxRedirects) {
      throw new NSendError('Max redirects exceeded')
    }

    this.redirects.push({
      url: this.url,
      statusCode: res.statusCode,
      headers: res.headers
    })
    if (res.statusCode !== 307 && !_.includes(consts.SAFE_METHODS, this.method)) {
      this.method = 'get'
      this.headers = _.reduce(this.headers, (result, value, name) => {
        if (!/^content-/i.test(name)) {
          result[name] = value
        }
        return result
      }, {})
    }
    this.url = location
    this.baseUrl = undefined
    this.data = undefined

    res = await adapter.performRequest(this._getAdapterOptions())
    return this._followRedirects(res)
  }
}

module.exports = NSendCore
