type HttpVer = 
  | 'http/1'
  | 'http/2';

type Method =
  | 'get' | 'GET'
  | 'delete' | 'DELETE'
  | 'head' | 'HEAD'
  | 'options' | 'OPTIONS'
  | 'post' | 'POST'
  | 'put' | 'PUT'
  | 'patch' | 'PATCH';

type ResponseType = 
  | 'json'
  | 'text'
  | 'stream';

interface NSendRequestOptions {
  httpVer?: HttpVer,
  method?: Method;
  baseUrl?: string;
  url?: string;
  params?: any;
  auth?: {
    username: string;
    password: string;
  };
  headers?: any;
  data?: any;
  timeout?: number;
  maxContentLength?: number;
  maxRedirects?: number;
  responseType?: ResponseType;
  responseEncoding?: String;
}

interface NSendResponse {
  statusCode: number;
  statusText: string;
  headers: any;
  request?: any;
  data?: any;
}

interface NSendError extends Error {
  opts: NSendRequestOptions;
  code?: string;
  request?: any;
  response?: NSendResponse;
}

interface NSendPromise extends Promise<NSendResponse> {
}

interface NSendCore {
  getInstance(): NSendCore;
  send(opts: NSendRequestOptions): NSendPromise;
}

interface NSendInstance {
  (opts: NSendRequestOptions): NSendPromise;
  get(url: string, opts?: NSendRequestOptions): NSendPromise;
  delete(url: string, opts?: NSendRequestOptions): NSendPromise;
  head(url: string, opts?: NSendRequestOptions): NSendPromise;
  post(url: string, data?: any, opts?: NSendRequestOptions): NSendPromise;
  put(url: string, data?: any, opts?: NSendRequestOptions): NSendPromise;
  patch(url: string, data?: any, opts?: NSendRequestOptions): NSendPromise;
  NSend: NSendCore;
  NSendError: NSendError
}

declare const NSend: NSendInstance;
export = NSend;
