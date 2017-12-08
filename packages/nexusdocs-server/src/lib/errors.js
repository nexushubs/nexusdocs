import status from 'statuses';
import _ from 'lodash';

export class ApiError extends Error {

  constructor(code, message, errors) {
    super();
    this.code = code || 500;
    this.message = message || this.parseCode(this.code);
    this.errors = errors;
  }

  parseCode(code) {
    const message = status[code + ''];
    return message || 'Unknown HTTP Error';
  }
  
}

export class ValidationError extends Error {

  constructor(errors, ...args) {
    super();
    if (args.length) {
      errors = buildValidationError(errors, ...args);
    }
    if (!_.isArray(errors)) {
      errors = [errors];
    }
    this.errors = errors;
  }
  
}

export function buildValidationError(code, property, reason, message) {
  return { code, property: `@.${property}`, reason, message };
}
