import * as _ from 'lodash';
import * as uuid from 'uuid';
import * as config from 'config';
import { Db, Collection, FindOneOptions, FilterQuery, ObjectId } from 'mongodb';

import { ValidationError, buildValidationError } from '../lib/errors';
import { buildValidator, Validator } from '../lib/validator';
import Base from '../lib/Base';
import EsIndex from './EsIndex';
import { IBaseModelStatic, IBaseData } from './types';
import getNewFilename from 'new-filename';

type ValueOf<T, K extends keyof T> = T[K];

type InstanceIterator<T> = (instance: T) => Promise<void>;

export default class BaseModel<TModel extends BaseModel<TModel,TData>, TData extends IBaseData, TConfig = any> extends Base {
  
  public _active: boolean;
  public _deleted: boolean;
  public _data: TData;
  public _static?: IBaseModelStatic<TModel, TData, TConfig>;
  
  constructor(data: TData) {
    super();
    this._active = !!data;
    this._deleted = false;
    this._data = {} as TData;
    this._static = this.constructor as IBaseModelStatic<TModel, TData, TConfig>;
    if (data && _.isPlainObject(data)) {
      this.data(data);
    }
  }

  getInstance(data: Partial<TData>): TModel {
    const instance = new (<any> this.constructor)(data);
    instance.init();
    return instance;
  }

  get es(): EsIndex<TData> {
    if (!this._static.esSync) {
      throw new Error('elasticsearch sync is not activated on this collection');
    }
    if (!this._static.es) {
      this._static.es = new EsIndex(this._static.collectionName);
    }
    return this._static.es;
  }

  get collection(): Collection<TData> {
    return this._static.collection;
  }

  init() {
    if (!this._static.initialized) {
      this._static.validator = buildValidator(this._static.schema);
      this._static.collection = this.db.collection(this._static.collectionName);
      const configKey = `models.${this._static.name}`;
      this._static.config = config.has(configKey) ? config.get<TConfig>(configKey) : {} as any;
      this._static.initialized = true;
    }
    this.bindDataProperties();
    const aliases = ['find', 'findOne'];
    aliases.forEach(method => {
      this[method] = this.collection[method].bind(this.collection);
    });
  }

  get config() {
    return this._static.config;
  }

  private bindDataProperties() {
    const keys = Object.keys(this._static.schema) as (keyof TData)[];
    keys.unshift('_id' as keyof TData);
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
  
  validate(data: any, options = {}) {
    const result = this._static.validator.validate(data, {
      ...options,
      custom: this._static.validatorPlugins,
    });
    if (!result.valid) {
      throw new ValidationError(result.error);
    }
  }

  validateOne(key: keyof TData, value: any): void {
    const result = this._static.validator.validate({
      [key]: value,
    }, key);
    if (!result.valid) {
      throw new ValidationError(result.error);
    }
  }

  generateId(): string {
    return uuid.v4();
  }

  prepareId(id?: string): string {
    if (id) {
      return id;
    } else if (this._active) {
      return this._data._id;
    } else {
      throw new Error('cannot pass empty id on none-instance model');
    }
  }

  prepareData(data: TData = null, validateOptions: any = {}): TData {
    if (data) {
      this.validate(data, validateOptions);
      return data;
    } else if (this._data) {
      return this._data;
    } else {
      throw new Error('cannot pass empty data on none-instance model');
    }
  }

  forceActiveModel() {
    if (!this._active) {
      throw new Error('cannot call this in none-active model');
    }
  }

  async beforeCreate(data: Partial<TData>) {
  }

  async create(data: Partial<TData>, skipHooks = false): Promise<TModel> {
    if (!skipHooks) {
      await this.beforeCreate(data);
    }
    this.validate(data);
    data._id = data._id || this.generateId();
    await this.collection.insertOne(data as TData);
    const instance = this.getInstance(data);
    if (this._static.esSync) {
      const { _id, ...rest } = data;
      await this.es.create(_id, rest as TData);
    }
    if (!skipHooks) {
      await instance.afterCreate(data);
    }
    return instance;
  }

  async afterCreate(data: Partial<TData>) {
  }

  async beforeUpdate(data: Partial<TData>) {
  }
  
  async update(data: Partial<TData>, query?: FilterQuery<TData>): Promise<TModel | undefined> {
    if (query) {
      const instance = await this.get(query);
      if (!instance) {
        return undefined;
      }
      return instance.update(data);
    }
    await this.beforeUpdate(data);
    delete data._id;
    this.data(data);
    await this.collection.updateOne({ _id: this.data('_id') }, { $set: this.data() });
    if (this._static.esSync) {
      if (this._active) {
        data = this.data();
      } else {
        data = await this.collection.findOne(query);
      }
      const { _id, ...rest } = data;
      await this.es.update(_id, { doc: rest, doc_as_upsert: true });
    }
    await this.afterUpdate(data);
    return this as any;
  }
 
  async afterUpdate(data: Partial<TData>) {
  }
  
  async getAll(query: FilterQuery<TData> = {}, options?: FindOneOptions, iterator?: InstanceIterator<TModel>): Promise<TModel[]> {
    const items = await this.collection.find(query, options || this._static.defaultQueryOptions).toArray();
    const instances = items.map(item => this.getInstance(item));
    if (iterator) {
      for (const instance of instances) {
        await iterator(instance);
      }
    }
    return instances;
  }

  async get(query: string | FilterQuery<TData>, options?: FindOneOptions): Promise<TModel | null> {
    if (_.isString(query)) {
      query = {
        _id: this.prepareId(query),
      };
    }
    const data = await this.collection.findOne(query, options || this._static.defaultQueryOptions);
    if (!data) return null;
    const instance = this.getInstance(data);
    return instance;
  }
  
  async beforeDelete(id: string): Promise<void> {
  }

  async delete(id?: any) {
    const _id = this.prepareId(id);
    await this.beforeDelete(_id);
    await this.collection.deleteOne({ _id });
    if (!id) {
      this._deleted = true;
    }
    if (this._static.esSync) {
      await this.es.delete(_id);
    }
    return this;
  }

  async exists(query: FilterQuery<TData>): Promise<boolean> {
    const count = await this.collection.countDocuments(query);
    return count > 0;
  }

  async getUniqueTitle<K extends keyof TData>(query: FilterQuery<TData>, field: K, value: string): Promise<string> {
    const list = await this.collection.find(query, { projection: { [field]: 1 }}).toArray();
    const names = _.map(list, field) as any;
    return getNewFilename(names as string[], value);
  }

  async ensureUnique(query: FilterQuery<TData>) {
    const count = await this.collection.countDocuments(query);
    if (count > 0) {
      const fields = _.keys(query);
      const errors = fields.map(key => buildValidationError(null, key, 'unique', 'should be unique'));
      throw new ValidationError(errors);
    }
  }

  data(): TData;
  data<K extends keyof TData>(key: K): ValueOf<TData, K>;
  data<K extends keyof TData>(key: K, value: ValueOf<TData, K>): void;
  data(data: Partial<TData>): void;
  data<K extends keyof TData>(key?: K | Partial<TData>, value?: ValueOf<TData, K>): ValueOf<TData, K> | TData | undefined {
    this.forceActiveModel();
    if (_.isUndefined(key)) {
      return this._data;
    } else if (_.isString(key)) {
      if (_.isUndefined(value)) {
        return this._data[key as K];
      } else {
        this.validateOne(key as keyof TData, value);
        this._data[key as keyof TData] = value;
      }
    } else if (_.isPlainObject(key)) {
      const values = _.omitBy(key as TData, _.isUndefined);
      const keys = Object.keys(values);
      this.validate(values, { fields: keys });
      _.extend(this._data, values);
    } else {
      throw new TypeError('invalid data key');
    }
  }

  toJSON(): TData {
    return this.data();
  }

}
