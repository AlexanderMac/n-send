const _ = require('lodash');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const should = require('should');
const nsend = require('../../');

let _server;

describe('functional tests', () => {
  function _createServer(handler, test) {
    _server = http.createServer(handler).listen(8008, test);
  }

  function _createHttpsServer(handler, test) {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    let cert = fs.readFileSync(path.resolve(__dirname, 'server.crt'));
    let key = fs.readFileSync(path.resolve(__dirname, 'server.pem'));
    _server = https.createServer({ cert, key }, handler).listen(8008, test);
  }

  function _sendSuccess(req, res, status, data) {
    res.statusCode = status;
    data = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      data
    };
    data = JSON.stringify(data);

    res.end(data);
  }

  function _sendNotFound(res) {
    res.statusCode = 404;
    res.end('Not found');
  }

  function _readReqData(req, cb) {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => cb(body));
  }

  function _test(opts, status, expected, done) {
    return () => {
      Promise
        .resolve()
        .then(async () => {
          let res = await nsend(opts);
          should(res.status).equal(status);
          should(res.data).eql(expected);
          done();
        })
        .catch(err => {
          if (_.isError(expected)) {
            should(err).eql(expected);
            return done();
          }
          throw err;
        })
        .catch(err => done(err));
    };
  }

  afterEach(() => {
    if (_server) {
      _server.close();
      _server = null;
    }
  });

  describe('base params', () => {
    function handler() {
      return (req, res) => {
        let parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname === '/users/1') {
          _sendSuccess(req, res, 200, 'user1');
        } else {
          _sendNotFound(res);
        }
      };
    }

    it('should use opts.url (http)', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1',
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should use opts.url (https)', (done) => {
      let opts = {
        method: 'GET',
        url: 'https://localhost:8008/users/1',
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: 'user1'
      };

      _createHttpsServer(handler(), _test(opts, status, expected, done));
    });

    it('should use opts.url and opts.baseUrl', (done) => {
      let opts = {
        method: 'GET',
        url: '/users/1',
        baseUrl: 'http://localhost:8008',
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should use opts.params', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1',
        params: {
          ts: 123123123123
        },
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1?ts=123123123123',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should use opts.params and opts.url.query', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1?token=sometoken',
        params: {
          ts: 123123123123
        },
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1?token=sometoken&ts=123123123123',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should use opts.auth', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1',
        auth: {
          username: 'admin',
          password: 'pass'
        },
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:8008',
          connection: 'close',
          authorization: 'Basic YWRtaW46cGFzcw=='
        },
        data: 'user1'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should use opts.headers', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1',
        headers: {
          'Accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
          'Accept-Language': 'en-US, en;q=0.5',
          'Connection': 'keep-alive'
        },
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          'host': 'localhost:8008',
          'accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
          'accept-language': 'en-US, en;q=0.5',
          'connection': 'keep-alive'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });
  });

  describe('timeout', () => {
    function handler(timeout) {
      return (req, res) => {
        let parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname === '/users/1') {
          setTimeout(() => _sendSuccess(req, res, 200, 'user1'), timeout);
        } else {
          _sendNotFound(res);
        }
      };
    }

    it('should use opts.timeout and don not abort req (not exceeded)', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1',
        timeout: 50,
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(20), _test(opts, status, expected, done));
    });

    it('should use opts.timeout and abort req (exceeded)', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1',
        timeout: 50,
        responseType: 'json'
      };
      let status = 200;
      let expected = new nsend.NSendError('Timeout of 50ms exceeded');

      _createServer(handler(100), _test(opts, status, expected, done));
    });
  });

  describe('data', () => {
    function handler() {
      return (req, res) => {
        let parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname === '/users') {
          _readReqData(req, (data) => _sendSuccess(req, res, 200, data));
        } else {
          _sendNotFound(res);
        }
      };
    }

    it('should send the JSON data', (done) => {
      let opts = {
        method: 'POST',
        url: 'http://localhost:8008/users',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { name: 'user2' },
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'POST',
        url: '/users',
        headers: {
          host: 'localhost:8008',
          connection: 'close',
          'content-length': '16',
          'content-type': 'application/json'
        },
        data: '{"name":"user2"}'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should send the Buffer data', (done) => {
      let opts = {
        method: 'PUT',
        url: 'http://localhost:8008/users',
        headers: {
          'Content-Type': 'text/plain'
        },
        data: Buffer.from('{"name":"user22"}'),
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'PUT',
        url: '/users',
        headers: {
          host: 'localhost:8008',
          connection: 'close',
          'content-length': '17',
          'content-type': 'text/plain'
        },
        data: '{"name":"user22"}'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it.skip('should send the Stream data', (done) => {
      // TODO: doesn't work
      let opts = {
        method: 'PATCH',
        url: 'http://localhost:8008/users',
        data: fs.createReadStream(path.resolve(__dirname, 'data.txt')),
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'PATCH',
        url: '/users',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: '{"name":"user23"}'
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });
  });

  describe('maxContentLength', () => {
    function handler(count) {
      return (req, res) => {
        let parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname === '/users') {
          let data = _.times(count, Number).join('');
          _sendSuccess(req, res, 201, data);
        } else {
          _sendNotFound(res);
        }
      };
    }

    it('should use opts.maxContentLength and don not abort req (not exceeded)', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users',
        maxContentLength: 120,
        responseType: 'json'
      };
      let status = 201;
      let expected = {
        method: 'GET',
        url: '/users',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: '0123456789'
      };

      _createServer(handler(10), _test(opts, status, expected, done));
    });

    it('should use opts.maxContentLength and abort req (exceeded)', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users',
        maxContentLength: 120,
        responseType: 'json'
      };
      let status = 201;
      let expected = new nsend.NSendError('MaxContentLength size of 120 exceeded');

      _createServer(handler(30), _test(opts, status, expected, done));
    });
  });

  describe('maxRedirects', () => {
    function handler() {
      return (req, res) => {
        let parsedUrl = url.parse(req.url);
        switch (parsedUrl.pathname) {
          case '/users':
            res.setHeader('location', 'http://localhost:8008/v2/users');
            return _sendSuccess(req, res, 301);
          case '/v2/users':
            res.setHeader('location', 'http://localhost:8008/v3/users');
            return _sendSuccess(req, res, 301);
          case '/v3/users':
            return _sendSuccess(req, res, 200, { users: 'users' });
          default:
            return _sendNotFound(res);
        }
      };
    }

    it('should just return response when opts.maxRedirects == 0 and res.status in [300,399]', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users',
        responseType: 'json',
        maxRedirects: 0
      };
      let status = 301;
      let expected = {
        method: 'GET',
        url: '/users',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        }
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should just return response when opts.maxRedirects > 0 and res.status not in [300,399]', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/v3/users',
        responseType: 'json',
        maxRedirects: 2
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/v3/users',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: { users: 'users' }
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should follow redirects when opts.maxRedirects > 0 and res.status in [300,399]', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users',
        responseType: 'json',
        maxRedirects: 2
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/v3/users',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: { users: 'users' }
      };

      _createServer(handler(), _test(opts, status, expected, done));
    });

    it('should throw error when redirectCount exceeds opts.maxRedirects', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users',
        responseType: 'json',
        maxRedirects: 1
      };
      let status = 200;
      let expected = new nsend.NSendError('Max redirects exceeded');

      _createServer(handler(), _test(opts, status, expected, done));
    });
  });

  describe('responseType', () => {
    function handler() {
      return (req, res) => {
        let parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname === '/users/1') {
          _sendSuccess(req, res, 200, { user: 'user1' });
        } else {
          _sendNotFound(res);
        }
      };
    }

    it('should use opts.responseType=json', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1',
        responseType: 'json'
      };
      let status = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: { user: 'user1' }
      };

      _createServer(handler(30), _test(opts, status, expected, done));
    });

    it('should use opts.responseType=text', (done) => {
      let opts = {
        method: 'GET',
        url: 'http://localhost:8008/users/1',
        responseType: 'text'
      };
      let status = 200;
      let expected = JSON.stringify({
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:8008',
          connection: 'close'
        },
        data: { user: 'user1' }
      });

      _createServer(handler(30), _test(opts, status, expected, done));
    });

    it('should use opts.responseType=stream', (done) => {
      async function test() {
        let opts = {
          method: 'GET',
          url: 'http://localhost:8008/users/1',
          responseType: 'stream'
        };
        let status = 200;
        let expected = JSON.stringify({
          method: 'GET',
          url: '/users/1',
          headers: {
            host: 'localhost:8008',
            connection: 'close'
          },
          data: { user: 'user1' }
        });

        let res = await nsend(opts);

        let resDataBuffer = [];
        res.data.on('data', chunk => resDataBuffer.push(chunk));
        res.data.on('end', () => {
          let resData = Buffer.concat(resDataBuffer).toString();
          try {
            should(res.status).equal(status);
            should(resData).eql(expected);
            done();
          } catch (err) {
            done(err);
          }
        });
      }

      _createServer(handler(30), test);
    });
  });

  describe('responseEncoding', () => {
    it.skip('should use opts.responseEncoding=utf8', () => {
    });

    it.skip('should use opts.responseEncoding=utf16', () => {
    });
  });
});
