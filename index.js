const Core = require('./src/core');

const nsend = Core.getInstance();
nsend.NSend = Core;
nsend.NSendError = require('./src/error');
nsend.getInstance = Core.getInstance;

module.exports = nsend;
