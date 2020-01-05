const _ = require('lodash');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const should = require('should');
const nsend = require('../../');

let _server;

describe('http1 / functional tests', () => {
  function _createServer(handler, test) {
    _server = http.createServer(handler).listen(3010, test);
  }

  function _createSecureServer(handler, test) {
    let cert = fs.readFileSync(path.resolve(__dirname, 'server.crt'));
    let key = fs.readFileSync(path.resolve(__dirname, 'server.pem'));
    _server = https.createServer({ cert, key }, handler).listen(3011, test);
  }

  function _sendSuccess(req, res, statusCode, data) {
    res.statusCode = statusCode;
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

  function _test(options, statusCode, expected, done) {
    return () => {
      Promise
        .resolve()
        .then(async () => {
          let res = await nsend(options);
          should(res.statusCode).equal(statusCode);
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
        _sendSuccess(req, res, 200, 'user1');
      };
    }

    it('should use options.url (http)', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.url (https)', (done) => {
      let options = {
        method: 'GET',
        url: 'https://localhost:3011/users/1',
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:3011',
          connection: 'close'
        },
        data: 'user1'
      };

      _createSecureServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.url and options.baseUrl', (done) => {
      let options = {
        method: 'GET',
        url: '/users/1',
        baseUrl: 'http://localhost:3010',
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.params', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        params: {
          ts: 123123123123
        },
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1?ts=123123123123',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.params and options.url.query', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1?token=sometoken',
        params: {
          ts: 123123123123
        },
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1?token=sometoken&ts=123123123123',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.auth', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        auth: {
          username: 'admin',
          password: 'pass'
        },
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:3010',
          connection: 'close',
          authorization: 'Basic YWRtaW46cGFzcw=='
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.headers', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        headers: {
          'Accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
          'Accept-Language': 'en-US, en;q=0.5',
          'Connection': 'keep-alive'
        },
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          'host': 'localhost:3010',
          'accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
          'accept-language': 'en-US, en;q=0.5',
          'connection': 'keep-alive'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });
  });

  describe('timeout', () => {
    function handler(timeout) {
      return (req, res) => {
        setTimeout(() => _sendSuccess(req, res, 200, 'user1'), timeout);
      };
    }

    it('should use options.timeout and don not abort req (not exceeded)', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        timeout: 50,
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: 'user1'
      };

      _createServer(handler(20), _test(options, statusCode, expected, done));
    });

    it('should use options.timeout and abort req (exceeded)', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        timeout: 50,
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = new nsend.NSendError('Timeout of 50ms exceeded');

      _createServer(handler(100), _test(options, statusCode, expected, done));
    });
  });

  describe('data', () => {
    function handler() {
      return (req, res) => {
        _readReqData(req, (data) => _sendSuccess(req, res, 200, data));
      };
    }

    it('should send JSON data', (done) => {
      let options = {
        method: 'POST',
        url: 'http://localhost:3010/users',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { name: 'user2' },
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'POST',
        url: '/users',
        headers: {
          host: 'localhost:3010',
          connection: 'close',
          'content-length': '16',
          'content-type': 'application/json'
        },
        data: '{"name":"user2"}'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should send Buffer data', (done) => {
      let options = {
        method: 'PUT',
        url: 'http://localhost:3010/users',
        headers: {
          'Content-Type': 'text/plain'
        },
        data: Buffer.from('{"name":"user22"}'),
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'PUT',
        url: '/users',
        headers: {
          host: 'localhost:3010',
          connection: 'close',
          'content-length': '17',
          'content-type': 'text/plain'
        },
        data: '{"name":"user22"}'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it.skip('should send Stream data', (done) => {
      // TODO: doesn't work
      let options = {
        method: 'PATCH',
        url: 'http://localhost:3010/users',
        data: fs.createReadStream(path.resolve(__dirname, 'data.txt')),
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'PATCH',
        url: '/users',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: '{"name":"user23"}'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });
  });

  describe('maxContentLength', () => {
    function handler(count) {
      return (req, res) => {
        let data = _.times(count, Number).join('');
        _sendSuccess(req, res, 201, data);
      };
    }

    it('should use options.maxContentLength and don not abort req (not exceeded)', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users',
        maxContentLength: 120,
        responseType: 'json'
      };
      let statusCode = 201;
      let expected = {
        method: 'GET',
        url: '/users',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: '0123456789'
      };

      _createServer(handler(10), _test(options, statusCode, expected, done));
    });

    it('should use options.maxContentLength and abort req (exceeded)', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users',
        maxContentLength: 120,
        responseType: 'json'
      };
      let statusCode = 201;
      let expected = new nsend.NSendError('MaxContentLength size of 120 exceeded');

      _createServer(handler(30), _test(options, statusCode, expected, done));
    });
  });

  describe('maxRedirects', () => {
    function handler() {
      return (req, res) => {
        let parsedUrl = url.parse(req.url);
        switch (parsedUrl.pathname) {
          case '/users':
            res.setHeader('location', 'http://localhost:3010/v2/users');
            return _sendSuccess(req, res, 301);
          case '/v2/users':
            res.setHeader('location', 'http://localhost:3010/v3/users');
            return _sendSuccess(req, res, 301);
          case '/v3/users':
            return _sendSuccess(req, res, 200, { users: 'users' });
          default:
            return _sendNotFound(res);
        }
      };
    }

    it('should just return response when options.maxRedirects == 0 and res.statusCode in [300,399]', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users',
        responseType: 'json',
        maxRedirects: 0
      };
      let statusCode = 301;
      let expected = {
        method: 'GET',
        url: '/users',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        }
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should just return response when options.maxRedirects > 0 and res.statusCode not in [300,399]', (done) => {
      let options = {
        method: 'POST',
        url: 'http://localhost:3010/v3/users',
        responseType: 'json',
        maxRedirects: 2,
        data: {
          user: { id: 1 }
        }
      };
      let statusCode = 200;
      let expected = {
        method: 'POST',
        url: '/v3/users',
        headers: {
          host: 'localhost:3010',
          connection: 'close',
          'content-length': '17'
        },
        data: { users: 'users' }
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should follow redirects when options.maxRedirects > 0 and res.statusCode in [300,399]', (done) => {
      let options = {
        method: 'POST',
        url: 'http://localhost:3010/users',
        responseType: 'json',
        maxRedirects: 2,
        headers: {
          'x-client-time': '123331221321',
          'content-type': 'application/json'
        },
        data: {
          user: { id: 1 }
        }
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/v3/users',
        headers: {
          host: 'localhost:3010',
          'x-client-time': '123331221321',
          connection: 'close'
        },
        data: { users: 'users' }
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should throw error when redirectCount exceeds options.maxRedirects', (done) => {
      let options = {
        method: 'POST',
        url: 'http://localhost:3010/users',
        responseType: 'json',
        maxRedirects: 1
      };
      let statusCode = 200;
      let expected = new nsend.NSendError('Max redirects exceeded');

      _createServer(handler(), _test(options, statusCode, expected, done));
    });
  });

  describe('responseType', () => {
    function handler() {
      return (req, res) => {
        _sendSuccess(req, res, 200, { user: 'user1' });
      };
    }

    it('should use options.responseType=json', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: { user: 'user1' }
      };

      _createServer(handler(30), _test(options, statusCode, expected, done));
    });

    it('should use options.responseType=text', (done) => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        responseType: 'text'
      };
      let statusCode = 200;
      let expected = JSON.stringify({
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: { user: 'user1' }
      });

      _createServer(handler(30), _test(options, statusCode, expected, done));
    });

    it('should use options.responseType=stream', (done) => {
      async function test() {
        let options = {
          method: 'GET',
          url: 'http://localhost:3010/users/1',
          responseType: 'stream'
        };
        let statusCode = 200;
        let expected = JSON.stringify({
          method: 'GET',
          url: '/users/1',
          headers: {
            host: 'localhost:3010',
            connection: 'close'
          },
          data: { user: 'user1' }
        });

        let res = await nsend(options);

        let resDataBuffer = [];
        res.data.on('data', chunk => resDataBuffer.push(chunk));
        res.data.on('end', () => {
          let resData = Buffer.concat(resDataBuffer).toString();
          try {
            should(res.statusCode).equal(statusCode);
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
    function handler() {
      return (req, res) => {
        _sendSuccess(req, res, 200, { user: 'user1' });
      };
    }

    it('should use options.responseEncoding=utf8', done => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        responseType: 'text',
        responseEncoding: 'utf8'
      };
      let statusCode = 200;
      let expected = JSON.stringify({
        method: 'GET',
        url: '/users/1',
        headers: {
          host: 'localhost:3010',
          connection: 'close'
        },
        data: { user: 'user1' }
      });

      _createServer(handler(30), _test(options, statusCode, expected, done));
    });

    it('should use options.responseEncoding=utf16le', done => {
      let options = {
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        responseType: 'text',
        responseEncoding: 'utf16le'
      };
      let statusCode = 200;
      let expected = '≻敭桴摯㨢䜢呅Ⱒ產汲㨢⼢獵牥⽳∱∬敨摡牥≳笺栢獯≴∺潬慣桬獯㩴〳〱Ⱒ挢湯敮瑣潩≮∺汣獯≥ⱽ搢瑡≡笺產敳≲∺獵牥∱絽';

      _createServer(handler(30), _test(options, statusCode, expected, done));
    });
  });
});
