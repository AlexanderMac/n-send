const Core = require('./src/core');
const methodAliases = require('./src/core/method-aliases');

const nsend = (options) => {
  let instance = new Core();
  return instance.send(options);
};
methodAliases.extend(nsend);
nsend.NSend = Core;
nsend.NSendError = require('./src/error');

module.exports = nsend;
