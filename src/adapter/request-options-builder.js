const _                        = require('lodash');
const { URL, URLSearchParams } = require('url');

class NSendRequestOptionsBuilder {
  static build(opts) {
    let instance = new NSendRequestOptionsBuilder(opts);
    return instance.build();
  }

  constructor({ method, baseUrl, url, params, auth, headers }) {
    this.inputMethod = method;
    this.inputBaseUrl = baseUrl;
    this.inputUrl = url;
    this.inputParams = params;
    this.inputAuth = auth;
    this.inputHeaders = _.clone(headers);
  }

  build() {
    this._parseUrl();
    this._parseParams();
    this._parseAuth();
    this._parseProxy();
    return this._buildOptions();
  }

  _parseUrl() {
    let parsedUrl = new URL(this.inputBaseUrl, this.inputUrl);

    this.protocol = parsedUrl.protocol;
    this.host = parsedUrl.host;
    this.port = parsedUrl.port;
    this.username = parsedUrl.username;
    this.password = parsedUrl.password;
    this.path = parsedUrl.pathname;
    if (parsedUrl.search) {
      this.path += parsedUrl.search;
    }
  }

  _parseParams() {
    if (this.inputParams) {
      let params = new URLSearchParams(this.inputParams).toString();
      let joinOp = _.includes(this.path, '?') ? '&' : '?';
      this.path += joinOp + params;
    }
  }

  _parseAuth() {
    if (this.inputAuth) {
      let username = _.toString(this.inputAuth.username);
      let password = _.toString(this.inputAuth.password);
      this.auth = username + ':' + password;
    } else if (this.username || this.password) {
      this.auth = this.username + ':' + this.password;
    }
    if (this.auth) {
      delete this.inputHeaders.authorization; // TODO: maybe leave?
    }
  }

  _parseProxy() {
    // TODO: implement
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
