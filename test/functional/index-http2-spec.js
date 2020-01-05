const _ = require('lodash');
const http2 = require('http2');
const url = require('url');
const fs = require('fs');
const path = require('path');
const should = require('should');
const nsend = require('../../');

let _server;

describe('http2 / functional tests', () => {
  function _createServer(handler, test) {
    _server = http2.createServer();
    _processRequest(3010, handler, test);
  }

  function _createSecureServer(handler, test) {
    _server = http2.createSecureServer({
      key: fs.readFileSync(path.resolve(__dirname, '../../', 'test', 'functional', 'server.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../..', 'test', 'functional', 'server.crt'))
    });
    _processRequest(3011, handler, test);
  }

  function _processRequest(port, handler, test) {
    let req;
    _server.on('request', r => req = r);
    _server.on('stream', stream => {
      let body = '';
      stream.on('data', chunk => body += chunk);
      stream.on('end', () => handler(req, stream, body));
    });
    _server.listen(port, test);
  }

  function _sendSuccess(req, res, statusCode, data) {
    data = JSON.stringify({
      headers: req.headers,
      data
    });

    res.respond({
      ':status': statusCode
    });
    res.end(data);
  }

  function _sendSuccessWithHeaders(req, res, headers, data) {
    data = JSON.stringify({
      headers: req.headers,
      data
    });

    res.respond(headers);
    res.end(data);
  }

  function _sendNotFound(res) {
    res.respond({
      ':status': 404
    });
    res.end('Not found');
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
        let parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname === '/users/1') {
          _sendSuccess(req, res, 200, 'user1');
        } else {
          _sendNotFound(res);
        }
      };
    }

    it('should use options.url (http)', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users/1'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.url (https)', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'https://localhost:3011/users/1',
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'https',
          ':authority': 'localhost:3011',
          ':method': 'get',
          ':path': '/users/1'
        },
        data: 'user1'
      };

      _createSecureServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.url and options.baseUrl', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: '/users/1',
        baseUrl: 'http://localhost:3010',
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users/1'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.params', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        params: {
          ts: 123123123123
        },
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users/1?ts=123123123123'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.params and options.url.query', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users/1?token=sometoken',
        params: {
          ts: 123123123123
        },
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users/1?token=sometoken&ts=123123123123'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it.skip('should use options.auth', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
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
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users/1'
          // TODO: doesn't work
          // authorization: 'Basic YWRtaW46cGFzcw=='
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should use options.headers', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        headers: {
          'Accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
          'Accept-Language': 'en-US, en;q=0.5'
        },
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users/1',
          'accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8',
          'accept-language': 'en-US, en;q=0.5'
        },
        data: 'user1'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
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

    it('should use options.timeout and don not abort req (not exceeded)', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        timeout: 50,
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users/1'
        },
        data: 'user1'
      };

      _createServer(handler(20), _test(options, statusCode, expected, done));
    });

    it('should use options.timeout and abort req (exceeded)', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
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
      return (req, res, body) => {
        let parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname === '/users') {
          _sendSuccess(req, res, 200, body);
        } else {
          _sendNotFound(res);
        }
      };
    }

    it('should send JSON data', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
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
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'post',
          ':path': '/users',
          'content-length': '16',
          'content-type': 'application/json'
        },
        data: '{"name":"user2"}'
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should send Buffer data', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
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
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'put',
          ':path': '/users',
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
        protocolVersion: 'http/2.0',
        method: 'PATCH',
        url: 'http://localhost:3010/users',
        data: fs.createReadStream(path.resolve(__dirname, 'data.txt')),
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'patch',
          ':path': '/users'
        },
        data: '{"name":"user23"}'
      };

      _createServer(handler, _test(options, statusCode, expected, done));
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

    it('should use options.maxContentLength and don not abort req (not exceeded)', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users',
        maxContentLength: 120,
        responseType: 'json'
      };
      let statusCode = 201;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users'
        },
        data: '0123456789'
      };

      _createServer(handler(10), _test(options, statusCode, expected, done));
    });

    it('should use options.maxContentLength and abort req (exceeded)', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
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
            return _sendSuccessWithHeaders(req, res, {
              ':status': 301,
              location: 'http://localhost:3010/v2/users'
            });
          case '/v2/users':
            return _sendSuccessWithHeaders(req, res, {
              ':status': 301,
              location: 'http://localhost:3010/v3/users'
            });
          case '/v3/users':
            return _sendSuccess(req, res, 200, { users: 'users' });
          default:
            return _sendNotFound(res);
        }
      };
    }

    it('should just return response when options.maxRedirects == 0 and res.statusCode in [300,399]', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users',
        responseType: 'json',
        maxRedirects: 0
      };
      let statusCode = 301;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users'
        }
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should just return response when options.maxRedirects > 0 and res.statusCode not in [300,399]', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
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
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'post',
          ':path': '/v3/users',
          'content-length': '17'
        },
        data: { users: 'users' }
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should follow redirects when options.maxRedirects > 0 and res.statusCode in [300,399]', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
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
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/v3/users',
          'x-client-time': '123331221321'
        },
        data: { users: 'users' }
      };

      _createServer(handler(), _test(options, statusCode, expected, done));
    });

    it('should throw error when redirectCount exceeds options.maxRedirects', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
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
        let parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname === '/users/1') {
          _sendSuccess(req, res, 200, { user: 'user1' });
        } else {
          _sendNotFound(res);
        }
      };
    }

    it('should use options.responseType=json', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        responseType: 'json'
      };
      let statusCode = 200;
      let expected = {
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':method': 'get',
          ':path': '/users/1'
        },
        data: { user: 'user1' }
      };

      _createServer(handler(30), _test(options, statusCode, expected, done));
    });

    it('should use options.responseType=text', (done) => {
      let options = {
        protocolVersion: 'http/2.0',
        method: 'GET',
        url: 'http://localhost:3010/users/1',
        responseType: 'text'
      };
      let statusCode = 200;
      let expected = JSON.stringify({
        headers: {
          ':scheme': 'http',
          ':authority': 'localhost:3010',
          ':path': '/users/1',
          ':method': 'get'
        },
        data: { user: 'user1' }
      });

      _createServer(handler(30), _test(options, statusCode, expected, done));
    });

    it.skip('should use options.responseType=stream', (done) => {
      // TODO: doesn't work
      async function test() {
        let options = {
          protocolVersion: 'http/2.0',
          method: 'GET',
          url: 'http://localhost:3010/users/1',
          responseType: 'stream'
        };
        let statusCode = 200;
        let expected = JSON.stringify({
          headers: {
            ':scheme': 'http',
            ':authority': 'localhost:3010',
            ':method': 'get',
            ':path': '/users/1'
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
    it.skip('should use options.responseEncoding=utf8', () => {
      // TODO: implement it
    });

    it.skip('should use options.responseEncoding=utf16', () => {
      // TODO: implement it
    });
  });
});
