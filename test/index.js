const sinon = require('sinon');
const nassert = require('n-assert');

nassert.initSinon(sinon);

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
