class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(msg, details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Please log in to continue') { return new ApiError(401, msg); }
  static paymentRequired(msg = 'Not enough credits') { return new ApiError(402, msg); }
  static notFound(msg = 'Resource not found') { return new ApiError(404, msg); }
  static conflict(msg) { return new ApiError(409, msg); }
  static unavailable(msg) { return new ApiError(503, msg); }
}

module.exports = ApiError;
