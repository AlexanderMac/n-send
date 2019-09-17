const _ = require('lodash');
const Core = require('./');

exports.extend = (nsend) => {
  _.each(['get', 'head', 'options', 'delete'], (method) => {
    nsend[method] = (url, opts) => {
      return Core.send(_extendOpts(opts, {
        method,
        url
      }));
    };
  });

  _.each(['post', 'put', 'patch'], (method) => {
    nsend[method] = (url, data, opts) => {
      return Core.send(_extendOpts(opts, {
        method,
        url,
        data
      }));
    };
  });
};

function _extendOpts(opts, ex) {
  return _.chain(opts)
    .cloneDeep()
    .extend(ex)
    .value();
}
