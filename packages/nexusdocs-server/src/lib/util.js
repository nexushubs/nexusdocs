import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import promisify from 'es6-promisify';
import isStream from 'is-stream';
import EventEmitter from 'events';
import camelCase from 'camelcase';
import jsonStringify from 'json-stable-stringify';

import { basePath } from '~/init/application';

export const uuidRegexPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function loadClass(path) {
  path = basePath() + '/' + path;
  return require(path).default;
}

export function loadClasses(path) {
  const classes = {};
  path = basePath() + '/' + path;
  const files = fs.readdirSync(path).forEach(name => {
    if (/\.map$/.test(name)) return;
    const classPath = path + '/' + name;
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
    newObject[method] = promisify(object[method], object);
  });
  return newObject;
}

export function promisifyStream(stream) {
  return new Promise((resolve, reject) => {
    if (!isStream(stream)) {
      reject(new TypeError('promisifyStream: not a stream object!'));
    }
    const successEvent = isStream.writable(stream) ? 'finish' : 'end';
    stream.on(successEvent, () => resolve());
    stream.on('error', err => reject(err));
  });
}

export function createErrorEvent(error) {
  const event = new EventEmitter;
  event.emit('error', error);
}

export const safeCustomResponseHeaders = [
  'content-type',
  'content-language',
  'expires',
  'cache-control',
  'content-disposition',
  'content-encoding',
];

export function parseQueryStringHeaders(req) {
  const headers = {};
  const pattern = /response\-/;
  _.each(req.query, (value, key) => {
    if (pattern.test(key)) {
      const name = key.replace(pattern, '').toLowerCase();
      if (safeCustomResponseHeaders.includes(name)) {
        headers[name] = value;
      }
    }
  });
  console.log(headers);
  return headers;
}

export function urlSafeBase64Encode(str) {
  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function sortedJSONStringify(obj) {
  return JSONStringify(data, (a, b) => a.key < b.key ? 1 : -1);
}
