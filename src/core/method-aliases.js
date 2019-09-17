const _ = require('lodash');

exports.extend = (instance) => {
  _.each(['get', 'head', 'options', 'delete'], (method) => {
    instance[method] = function(url, opts) {
      return this.send(_extendOpts(opts, {
        method,
        url
      }));
    };
  });

  _.each(['post', 'put', 'patch'], (method) => {
    instance[method] = function(url, data, opts) {
      return this.send(_extendOpts(opts, {
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
