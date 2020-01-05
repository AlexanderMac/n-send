const _ = require('lodash');
const { URLSearchParams } = require('url');
const utils = require('../utils');

class NSendRequestOptionsBuilder {
  static build(options) {
    let instance = new NSendRequestOptionsBuilder(options);
    return instance.build();
  }

  constructor({ method, baseUrl, url, params, auth, headers }) {
    this.inputMethod = method;
    this.inputBaseUrl = baseUrl;
    this.inputUrl = url;
    this.inputParams = params;
    this.inputAuth = auth;
    this.inputHeaders = headers;
  }

  build() {
    this._parseUrl();
    this._parseParams();
    this._parseAuth();
    this._parseProxy();
    return this._buildOptions();
  }

  _parseUrl() {
    let authority = utils.parseUrl(this.inputUrl, this.inputBaseUrl);

    this.protocol = authority.protocol;
    this.host = authority.hostname;
    this.port = authority.port;
    this.username = authority.username;
    this.password = authority.password;
    this.path = authority.pathname + (authority.search ? authority.search : '');
  }

  _parseParams() {
    if (this.inputParams) {
      let params = new URLSearchParams(this.inputParams).toString();
      let joinOp = _.includes(this.path, '?') ? '&' : '?';
      this.path += joinOp + params;
    }
  }

  // TODO: accoring to node.js docs auth <string> used to compute an Authorization header
  _parseAuth() {
    if (this.inputAuth) {
      let username = _.toString(this.inputAuth.username);
      let password = _.toString(this.inputAuth.password);
      this.auth = username + ':' + password;
    } else if (this.username || this.password) {
      // TODO: basic authentication using the URL itself, as detailed in RFC 1738, will be lost here:
      this.auth = this.username + ':' + this.password;
    }
  }

  _parseProxy() {
    // TODO: implement it
  }

  _buildOptions() {
    return {
      protocol: this.protocol,
      method: this.inputMethod,
      host: this.host,
      port: this.port,
      path: this.path,
      auth: this.auth,
      headers: this.inputHeaders
    };
  }
}

module.exports = NSendRequestOptionsBuilder;
