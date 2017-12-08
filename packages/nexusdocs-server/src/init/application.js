import path from 'path';
import EventEmetter from 'events';
import _ from 'lodash';
import promisify from 'es6-promisify';
import decamelize from 'decamelize';

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
      const { server, database, cli } = this.options;
      // connecting database;
      this.db = await connect(database.mongodb);
      // autoload models and services
      await this.autoload();
      if (!cli) {
        // lazy loading api routes
        const api = require('~/api').default;
        this.api = api;
        promisifyAll(api, ['listen', 'close']);
        await api.listen(server.port, server.hostname)
      }
      this.started = true;
      this.emit('start');
    } catch(e) {
      this.emit('error', e);
    }
  }

  stop() {
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
    await this.load(this.services, services);
  }

  load(holder, classes) {
    const initials = _.map(classes, (Class, name) => {
      const instance = new Class();
      this.bindLoader(instance);
      // keep both capitalized and lowercased
      holder[decamelize(name, '-')] = instance;
      holder[name] = instance;
      if (_.isFunction(instance.init)) {
        return instance.init();
      } else {
        instance.init();
        return Promise.resolve();
      }
    });
    return Promise.all(initials);
  }

  bindLoader(instance) {
    instance.server = this;
    instance.model = this.model;
    instance.service = this.service;
    instance.bindLoader = this.bindLoader;
  }

  /**
   * @returns
   */
  model(name) {
    if (!name) {
      return this.models;
    } else {
      return this.models[name];
    }
  }
  
  service(name) {
    if (!name) {
      return this.services;
    } else {
      return this.services[name];
    }
  }

}
