import path from 'path';
import EventEmetter from 'events';
import _ from 'lodash';
import promisify from 'es6-promisify';
import decamelize from 'decamelize';
import upperCamelCase from 'uppercamelcase';
import camelCase from 'camelcase';

import config from 'config';

import { connect, db } from '~/init/database';
import { promisifyAll } from '~/lib/util';
import * as models from '~/lib/model';
import * as services from '~/lib/service';

export function basePath () {
  return path.normalize(__dirname + '/..')
};

let instance = null;

/**
 * Get Application instance
 * @returns {Application}
 */
export function app() {
  return instance;
}

export default class Application extends EventEmetter {
  
  /**
   * NDS application constructor
   * @param {object} options - NDS Application options
   * @param {string} options.database - Mongodb connection url
   * @param {object} options.restful - RESTful API service options
   * @param {string} options.restful.enabled - whether start API service (useful when using module in your application or in CLI mode)
   * @param {string} options.restful.hostname - API listening hostname
   * @param {string} options.restful.port - API listening port
   */
  constructor(options = {}) {
    super();
    const defaultOptions = {
      database: 'mongodb://localhost:27017/nexusdocs',
      restful: {
        enabled: true,
        hostname: '127.0.0.1',
        port: 4000,
      },
    }
    config.util.extendDeep(defaultOptions, options);
    config.util.setModuleDefaults('Application', defaultOptions);
    this.db = null;
    this.api = null;
    this.startTime;
    this.models = {};
    this.services = {};
    this.model = this.model.bind(this);
    this.service = this.service.bind(this);
    this.bindLoader = this.bindLoader.bind(this);
    this.started = false;
    instance = this;
  }

  async start() {
    this.startTime = Date.now();
    this.emit('init');
    await this._start();
  }

  async _start() {
    try {
      const { database, restful: { hostname, port }, restfulEnabled } = config.get('Application');
      // connecting database;
      this.db = await connect(database);
      // autoload models and services
      await this.autoload();
      if (!restfulEnabled) {
        // lazy loading api routes
        const api = require('~/api').default;
        this.api = api;
        promisifyAll(api, ['listen', 'close']);
        await api.listen(parseInt(port), hostname);
      }
      this.started = true;
      this.emit('start');
    } catch(e) {
      this.emit('error', e);
    }
  }

  stop(force) {
    if (force) {
      process.exit(0);
    }
    if (this.started) {
      this._stop();
    } else {
      this.once('start', () => this.stop());
    }
  }
  
  async _stop() {
    try {
      if (this.db) {
        await this.db.close();
      }
      if (this.api) {
        await this.api.close();
      }
      await Promise.all(_.map(this.services, async (service, name) => {
        this.emit('stopping service');
        await service.stop();
        delete this.services[name];
      }));
      this.emit('stop');
    } catch(e) {
      this.emit('error', e);
    }
  }

  time() {
    return (Date.now() - this.startTime) / 1000;
  }

  async autoload() {
    await this.load(this.models, models);
    this.emit('starting service');
    await this.load(this.services, services);
  }

  load(holder, classes) {
    const initials = _.map(classes, (Class, name) => {
      const instance = new Class(name);
      this.bindLoader(instance);
      holder[Class.name] = instance;
      // console.log('init model:', Class.name);
      if (instance.init) {
        return instance.init();
      } else {
        return Promise.resolve();
      }
    });
    return Promise.all(initials);
  }

  /**
   * Bind model loader to any object
   * @param {any} instance 
   */
  bindLoader(instance) {
    instance.nds = this;
    instance.model = this.model;
    instance.service = this.service;
    instance.bindLoader = this.bindLoader;
  }

  /**
   * Get model instance
   * @param {Classes[]} holder 
   * @param {string} name 
   */
  _getLoaderInstance(holder, name) {
    if (!name) {
      const instances = {};
      _.each(holder, (model, name) => {
        const alias = decamelize(name, '-');
        instances[name] = model;
        instances[alias] = model;
      });
      return instances;
    } else {
      const alias = upperCamelCase(name);
      return holder[name] || holder[alias];
    }
  }
  
  model(name) {
    return this._getLoaderInstance(this.models, name);
  }
  
  service(name) {
    return this._getLoaderInstance(this.services, name);
  }

}
