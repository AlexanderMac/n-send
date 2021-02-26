const { URL } = require('url')
const NSendError = require('../error')

exports.parseUrl = (url, baseUrl) => {
  try {
    let authority = new URL(url, baseUrl)
    return authority
  } catch (err) {
    throw new NSendError(err)
  }
}
