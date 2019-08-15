import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import { promisify } from 'es6-promisify';
import * as isStream from 'is-stream';
import * as JSONStringify from 'json-stable-stringify';
import { EventEmitter } from 'events';
import { Headers } from 'node-fetch';

import { basePath } from '../lib/Application';
import { Readable, Stream } from 'stream';
import { Request } from 'express';
import { KeyValueMap } from '../types/common';

export const uuidRegexPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function loadClass(file: string) {
  file = basePath() + file;
  return require(file).default;
}

export function loadClasses(dir) {
  const classes = {};
  dir = basePath() + dir;
  const files = fs.readdirSync(dir).forEach(name => {
    // only auto load js file and directory
    if (!/^([a-z0-9\-]+$|\.js$)/.test(name)) return;
    const classPath = dir + '/' + name;
    const Class = require(classPath).default;
    classes[name] = Class;
  });
  return classes;
}

export function promisifyAll(object, methods) {
  const newObject = {};
  if (!_.isArray(methods)) {
    methods = _.keysIn(object).filter(key => _.isFunction(object[key]));
  }
  methods.map(method => {
    newObject[method] = promisify(object[method]);
  });
  return newObject;
}

export function promisifyEvent(emitter: EventEmitter, event: string | string[]) {
  if (_.isArray(event)) {
    return Promise.all(event.map(name => {
      return promisifyEvent(emitter, name);
    }))
  }
  return new Promise((resolve, reject) => {
    emitter.once(event, resolve);
    emitter.once('error', reject);
  });
}

export function promisifyStream(stream: Stream) {
  if (!isStream(stream)) {
    throw new TypeError('promisifyStream: not a stream object!');
  }
  const successEvent = isStream.writable(stream) ? 'finish' : 'end';
  return promisifyEvent(stream, successEvent);
}

export function createErrorEvent(error) {
  const event = new Readable;
  event.emit('error', error);
  return event;
}

export const safeCustomResponseHeaders = [
  'content-type',
  'content-language',
  'expires',
  'cache-control',
  'content-disposition',
  'content-encoding',
];

export function parseQueryStringHeaders(req: Request) {
  const headers = new Headers();
  const pattern = /response\-/;
  _.each(req.query, (value, key) => {
    if (pattern.test(key)) {
      const name = key.replace(pattern, '').toLowerCase();
      if (safeCustomResponseHeaders.includes(name)) {
        headers.set(name, value);
      }
    }
  });
  return headers;
}

export function urlSafeBase64Encode(str: string): string {
  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function sortedJSONStringify(object: any): string {
  return JSONStringify(object, (a, b) => a.key < b.key ? 1 : -1);
}

export function getExtension(filename: string): string {
  return path.extname(filename).slice(1);
}

export function getBasename(filename: string): string {
  return path.parse(filename).name;
}

export function currentTimestamp() {
  return Math.floor((new Date).valueOf() / 1000);
}

export function diffTimestampFromNow(t: number): number {
  const now = currentTimestamp();
  return t - now;
}
