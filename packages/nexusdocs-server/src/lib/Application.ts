import path from 'path';
import _ from 'lodash';
import express from 'express';
import config from 'config';

import packageJson from '../../package.json';
import { connect } from 'lib/database';
import { promisifyAll } from 'lib/util';
import * as models from 'models';
import * as services from 'services';
import createRestApi from 'api';
import Base from './Base.js';
import { ApplicationOptions } from 'types';

export function basePath () {
  return path.normalize(__dirname + '/..')
};

let instance: Application = null;

/**
 * Get Application instance
 */
export function app() {
  return instance;
}

export default class Application extends Base {
  
  public options: ApplicationOptions = null;
  public api: express.Application = null;
  public startTime: number = null;
  public started: boolean = false;
  public readonly version: string = (<any> packageJson).version;

  /**
   * NDS application constructor
   * @param options - NDS Application options
   */
  constructor(options: ApplicationOptions = {}) {
    super();
    this.app = this;
    this.options = _.merge({
      database: 'mongodb://localhost:27017/nexusdocs',
      restful: {
        enabled: true,
        hostname: '127.0.0.1',
        port: 4000,
        trustedProxy: '127.0.0.1',
        serverUrl: '',
      },
      debug: {
        request: true,
      }
    }, config.get('Application'), options)
    instance = this;
  }

  async start() {
    this.startTime = Date.now();
    this.emit('starting');
    await this._start();
  }

  async _start() {
    try {
      const { database, restful: { enabled, hostname, port } } = this.options;
      // connecting database;
      this.dbClient = await connect(database);
      this.db = this.dbClient.db();
      this.emit('dbconnected', database);
      await this.autoload();
      if (enabled) {
        // lazy loading api routes
        const api = createRestApi(this);
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

  stop(forceStop: boolean = false) {
    if (forceStop) {
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
      if (this.dbClient) {
        await this.dbClient.close();
      }
      if (this.api) {
        // await this.api.close();
      }
      await Promise.all(Object.keys(this.services).map(name => {
        const service = this.services[name];
        this.emit('stopping');
        return service.stop();
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
    await this.load('models', models);
    await this.load('services', services);
  }

  load(holderName, classes) {
    const holder = this[holderName];
    const initials = _.map(classes, (Class, name) => {
      let options = undefined;
      const key = `${holderName}.${Class.name}`;
      if (config.has(key)) {
        options = config.get(key);
      }
      const instance = new Class(options);
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

}
