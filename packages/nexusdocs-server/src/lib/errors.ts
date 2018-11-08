import status from 'statuses';
import _ from 'lodash';

export class ApiError extends Error {

  public code: number;
  public message: string;
  public errors?: any;

  constructor(code, message = null, errors = null) {
    super(message);
    this.code = code || 500;
    this.message = message || this.parseCode(this.code);
    this.errors = errors;
  }

  parseCode(code) {
    const message = status[code + ''];
    return message || 'Unknown Error';
  }
  
}

export class ValidationError extends Error {

  public errors: any;
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

export function buildValidationError(code, property = '', reason = '', message = '') {
  return { code, property: `@.${property}`, reason, message };
}
