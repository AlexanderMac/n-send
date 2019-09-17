const Core          = require('./src/core');
const methodAliases = require('./src/core/method-aliases');

const nsend = (opts) => {
  let instance = new Core();
  return instance.send(opts);
};
methodAliases.extend(nsend);
nsend.NSend = Core;
nsend.NSendError = require('./src/error');

module.exports = nsend;
