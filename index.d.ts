type ProtocolVersion =
  | 'http/1.0'
  | 'http/1.1'
  | 'http/2.0';

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
  protocolVersion?: ProtocolVersion,
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
  options: NSendRequestOptions;
  code?: string;
  request?: any;
  response?: NSendResponse;
}

interface NSendPromise extends Promise<NSendResponse> {
}

interface NSendCore {
  getInstance(): NSendCore;
  send(options: NSendRequestOptions): NSendPromise;
}

interface NSendInstance {
  (options: NSendRequestOptions): NSendPromise;
  get(url: string, options?: NSendRequestOptions): NSendPromise;
  delete(url: string, options?: NSendRequestOptions): NSendPromise;
  head(url: string, options?: NSendRequestOptions): NSendPromise;
  post(url: string, data?: any, options?: NSendRequestOptions): NSendPromise;
  put(url: string, data?: any, options?: NSendRequestOptions): NSendPromise;
  patch(url: string, data?: any, options?: NSendRequestOptions): NSendPromise;
  NSend: NSendCore;
  NSendError: NSendError
}

declare const NSend: NSendInstance;
export = NSend;
