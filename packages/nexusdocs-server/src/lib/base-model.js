import _ from 'lodash';
import { ObjectId } from 'mongodb';

import { ValidationError, buildValidationError } from '~/lib/errors';
import { buildValidator } from '~/lib/validator';
import { db } from '~/init/database';

export default class BaseModel {
  
  defaultProjection = undefined;
  
  constructor(data) {
    this.db = db;
    this._active = !!data;
    this._deleted = false;
    this._data = {};
    this.validator = buildValidator(this.schema);
    if (data && _.isPlainObject(data)) {
      this.data(data);
    }
  }

  getInstance(data) {
    const instance = new (this.constructor)(data);
    this.bindLoader(instance);
    instance.init();
    return instance;
  }

  init() {
    const collection = this.db.collection(`docs.${this.collectionName}`);
    this.collection = collection;
    this.bindDataProperties();
    const aliases = ['find', 'findOne'];
    aliases.forEach(method => {
      this[method] = collection[method].bind(this.collection);
    });
  }

  bindDataProperties() {
    const keys = Object.keys(this.schema);
    keys.unshift('_id');
    keys.forEach(key => {
      Object.defineProperty(this, key, {
        configurable: false,
        enumerable: true,
        get: () => {
          return this.data(key);
        },
        set: (value) => {
          this.data(key, value);
          return value;
        },
      });
    });
  }
  
  validate(data, options) {
    const result = this.validator.validate(data, {
      ...options,
      custom: this.validators,
    });
    if (!result.valid) {
      throw new ValidationError(result.error);
    }
  }

  validateOne(key, value) {
    const result = this.validator.validate({
      [key]: value,
    }, key);
    if (!result.valid) {
      throw new ValidationError(result.error);
    }
  }

  generateId() {
    return new ObjectId;
  }

  prepareId(id) {
    if (id) {
      if (_.isString(id) && /[0-9a-f]{24}/i.test(id)) {
        return ObjectId(id);
      } else {
        return id;
      }
    } else if (this._active) {
      return this._data._id;
    } else {
      throw new Error('cannot pass empty id on none-instance model');
    }
  }

  prepareData(data, validateOptions) {
    if (data) {
      this.validate(data, validateOptions);
      return data;
    } else if (this._data) {
      return this._data;
    } else {
      throw new Error('cannot pass empty data on none-instance model');
    }
  }

  beforeCreate(data) {
    // overide this method
  }

  async create(data, skipWrapMethod) {
    if (!skipWrapMethod) {
      await this.beforeCreate(data);
    }
    try {
      this.validate(data);
    } catch(err) {
      return Promise.reject(err);
    }
    data._id = data._id || this.generateId();
    await this.collection.insertOne(data);
    const instance = this.getInstance(data);
    return instance;
  }

  beforeUpdate() {
    // overide this method
  }
    
  async update(query, data) {
    let useInstance = false;
    if (_.isUndefined(data) && this._active) {
      useInstance = true;
      data = query;
      query = this.data('_id');
    }
    if (!_.isPlainObject(query)) {
      query = {
        _id: this.prepareId(query),
      };
    }
    await this.beforeUpdate(query, data);
    if (useInstance) {
      this.data(data);
    } else {
      this.prepareData(data);
    }
    await this.collection.update(query, { $set: this.data() });
    return this;
  }
 
  getAll(query, projection) {
    return this.collection.find(query, projection || this.defaultProjection).toArray();
  }

  async get(query, projection) {
    if (!_.isPlainObject(query)) {
      query = {
        _id: this.prepareId(query),
      };
    }
    const data = await this.collection.findOne(query, projection || this.defaultProjection);
    if (!data) return null;
    const instance = this.getInstance(data);
    return instance;
  }
  
  beforeDelete() {
    // overide this method
  }

  async delete(id) {
    const _id = this.prepareId(id);
    await this.beforeDelete(_id);
    await this.collection.remove({ _id });
    if (!id) {
      this._deleted = true;
    }
    return this;
  }

  async exists(query) {
    const count = await this.collection.count(query);
    return count > 0;
  }

  async ensureUnique(query, id) {
    const count = await this.collection.count(query);
    if (count > 0) {
      const fields = _.keys(query);
      const errors = fields.map(key => buildValidationError(null, key, 'unique', 'should be unique'));
      throw new ValidationError(errors);
    }
  }

  data(key, value) {
    if (!this._active) {
      throw new Error('cannot access data for a none active model');
    }
    if (_.isUndefined(key)) {
      return this._data;
    } else if (_.isString(key)) {
      if (_.isUndefined(value)) {
        return this._data[key];
      } else {
        this.validateOne(key, value);
        this._data[key] = value
      }
    } else if (_.isPlainObject(key)) {
      const values = _.omitBy(key, _.isUndefined);
      this.validate(values);
      _.extend(this._data, values);
      return this;
    } else {
      throw new TypeError('invalid data key');
    }
  }

  toObject() {
    return this.data();
  }

}
