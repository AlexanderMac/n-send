module.exports = class NSendError extends Error {
  static get(...params) {
    return new NSendError(...params);
  }

  constructor(message, details) {
    super(message);

    this.name = this.constructor.name;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
};
