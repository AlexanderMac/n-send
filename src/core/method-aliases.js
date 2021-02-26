const _ = require('lodash')
const Core = require('./')

exports.extend = (nsend) => {
  _.each(['get', 'head', 'options', 'delete'], (method) => {
    nsend[method] = (url, options) => {
      return Core.send(_extendOptions(options, {
        method,
        url
      }))
    }
  })

  _.each(['post', 'put', 'patch'], (method) => {
    nsend[method] = (url, data, options) => {
      return Core.send(_extendOptions(options, {
        method,
        url,
        data
      }))
    }
  })
}

function _extendOptions(options, ex) {
  return _.chain(options)
    .cloneDeep()
    .extend(ex)
    .value()
}
