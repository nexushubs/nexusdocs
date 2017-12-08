import path from 'path';
import EventEmetter from 'events';
import _ from 'lodash';
import promisify from 'es6-promisify';
import decamelize from 'decamelize';
import camelCase from 'camelcase';

import { connect, db } from '~/init/database';
import { promisifyAll } from '~/lib/util';
import * as models from '~/lib/model';
import * as services from '~/lib/service';

export function basePath () {
  return path.normalize(__dirname + '/..')
};

let instance = null;

export function app() {
  return instance;
}

export default class Application extends EventEmetter {
  
  constructor(options) {
    super();
    this.options = options;
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
      const { hostname, port, database, cli } = this.options;
      // connecting database;
      this.db = await connect(database);
      // autoload models and services
      await this.autoload();
      if (!cli) {
        // lazy loading api routes
        const api = require('~/api').default;
        this.api = api;
        promisifyAll(api, ['listen', 'close']);
        await api.listen(port, hostname);
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
      holder[name] = instance;
      if (instance.init) {
        return instance.init();
      } else {
        return Promise.resolve();
      }
    });
    return Promise.all(initials);
  }

  bindLoader(instance) {
    instance.nds = this;
    instance.model = this.model;
    instance.service = this.service;
    instance.bindLoader = this.bindLoader;
  }

  _instance(holder, name) {
    if (!name) {
      const instances = {};
      _.each(holder, (model, name) => {
        const alias = decamelize(name, '-');
        instances[name] = model;
        instances[alias] = model;
      });
      return instances;
    } else {
      const alias = camelCase(name);
      return holder[name] || holder[alias];
    }
  }
  
  model(name) {
    return this._instance(this.models, name);
  }
  
  service(name) {
    return this._instance(this.services, name);
  }

}
