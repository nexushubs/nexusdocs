import _ from 'lodash';
import { ObjectId } from 'mongodb';

import { ValidationError, buildValidationError } from '~/lib/errors';
import { buildValidator } from '~/lib/validator';
import { db } from '~/init/database';

export default class BaseModel {
  
  name = '';

  
  defaultProjection = undefined;
  
  constructor(data, isActive) {
    this.db = db;
    this._active = !!isActive;
    this._deleted = false;
    if (data && _.isObject(data)) {
      this._data = data;
    } else {
      data = {};
    }
  }

  getInstance(data) {
    const instance = new (this.constructor)(data, true);
    this.bindLoader(instance);
    instance.init();
    return instance;
  }

  init() {
    const collection = this.db.collection(`docs.${this.name}`);
    this.collection = collection;
    this.validator = buildValidator(this.schema);
    const aliases = ['find', 'findOne'];
    aliases.forEach(method => {
      this[method] = this.collection[method].bind(this.collection);
    });
    // if (this._data && !_.isEmpty(this._data)) {
    //   this.prepareData(this._data);
    // }
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
    try {
      this.validate(data);
    } catch(err) {
      return Promise.reject(err);
    }
    if (!skipWrapMethod) {
      await this.beforeCreate(data);
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
    if (_.isUndefined(data) && this._active) {
      data = query;
      query = this.data('_id');
    }
    if (!_.isPlainObject(query)) {
      query = {
        _id: this.prepareId(query),
      };
    }
    data = this.prepareData(data);
    await this.beforeUpdate(query, data);
    await this.collection.update(query, { $set: data });
    return this;
  }
 
  getAll(query) {
    return this.collection.find(query, this.defaultProjection).toArray();
  }

  async get(query) {
    if (!_.isPlainObject(query)) {
      query = {
        _id: this.prepareId(query),
      };
    }
    const data = await this.collection.findOne(query, this.defaultProjection);
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

  data(data, value) {
    if (!this._active) {
      throw new Error('cannot access data for a none active model');
    }
    if (!data) {
      return this._data;
    } else if (_.isString(data)) {
      return this._data[data];
    } else if (!_.isUndefined(value)) {
      this._data[data] = value;
      this._data = data;
      return this;
    } else {
      this.validate(data);
      this._data = data;
      return this;
    }
  }

  toObject() {
    return this.data();
  }

}
