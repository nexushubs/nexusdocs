import inspector from 'schema-inspector';
import _ from 'lodash';

export class Validator {

  constructor(schema, options = {}) {
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

  sanitize(data, options) {
    options = this.getOptions(options);
    const schema = this.prepareSchema(this.validation, options);
    return inspector.sanitize(schema, data);
  }

  validate(data, options) {
    options = this.getOptions(options);
    const schema = this.prepareSchema(this.validation, options);
    return inspector.validate(schema, data, options.custom);
  }

  getOptions(options) {
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

  prepareSchema(schema, options) {
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

export function buildValidator(...params) {
  return new Validator(...params);
}
