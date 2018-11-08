import inspector from 'schema-inspector';
import _ from 'lodash';

export class Validator {

  private validation: any;
  private sanitization: any;
  private options: any;
  private lastError: any;

  constructor(schema: any, options = {}) {
    let sanitization, validation;
    if (_.isObject(schema)) {
      if (schema.sanitization && schema.validation) {
        sanitization = schema.sanitization
        validation = schema.validation;
      } else {
        validation = schema;
      }
    } 
    this.validation = validation;
    this.sanitization = sanitization;
    this.options = _.defaults(options, {
      wrapObject: true,
      fields: false,
      custom: null,
    });
    this.lastError = null;
  }

  sanitize(data: any, options: any) {
    options = this.getOptions(options);
    const schema = this.prepareSchema(this.sanitization, options);
    return inspector.sanitize(schema, data);
  }

  validate(data: any, options: any) {
    options = this.getOptions(options);
    const schema = this.prepareSchema(this.validation, options);
    return inspector.validate(schema, data, options.custom);
  }

  getOptions(options: any) {
    if (_.isUndefined(options)) {
      options = {};
    } else if (_.isString(options)) {
      options = { fields: options.split(',')};
    } else if (_.isArray(options)) {
      options = { fields: options };
    }
    if (_.isObject(options)) {
      options = _.defaults(options, this.options);
    } else {
      options = this.options;
    }
    return options;
  }

  prepareSchema(schema: any, options: any) {
    if (options.fields) {
      schema = _.pick(schema, options.fields);
    }
    if (options.wrapObject) {
      schema = {
        type: 'object',
        properties: schema,
      };
    }
    // console.log('prepareSchema', schema, options)
    return schema;
  }

}

export function buildValidator(schema: any, options: any = null) {
  return new Validator(schema, options);
}
