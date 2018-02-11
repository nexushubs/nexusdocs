export class ApiError extends Error {

  constructor(code, message, errors) {
    super();
    this.code = code;
    this.message = message;
    this.errors = errors;
  }
  
}
