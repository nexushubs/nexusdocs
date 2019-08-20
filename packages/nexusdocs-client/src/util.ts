import qs from 'qs';
import JSONStringify from 'json-stable-stringify';
import isStream from 'is-stream';
import { Readable, Writable } from 'stream';

export function promisifyStream(stream: Readable | Writable) {
  return new Promise((resolve, reject) => {
    if (!isStream(stream)) {
      reject(new TypeError('promisifyStream: not a stream object!'));
    }
    const successEvent = isStream.writable(stream) ? 'finish' : 'end';
    stream.on(successEvent, () => resolve());
    stream.on('error', err => reject(err));
  });
}

export function getTimestamp(t?: Date | number) {
  if (typeof t === 'undefined') {
    t = new Date;
  }
  if (t instanceof Date) {
    t = Math.round(t.valueOf() / 1000);
  }
  // if t is before 2017-01-01, assume it is a time period
  if (typeof t === 'number' && t < new Date('2017-01-01').valueOf() / 1000) {
    t = Math.round(Date.now() / 1000) + t;
  }
  return t;
}

export function urlSafeBase64Encode(str: string) {
  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function sortedJSONStringify(obj: any) {
  return JSONStringify(obj, (a, b) => a.key < b.key ? 1 : -1);
}

export function sortObjectKey(obj: any) {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = obj[key];
  })
  return sorted;
}

export function addUrlParams(url, params) {
  const separator = /\?/.test(url) ? '&' : '?';
  return `${url}${separator}${qs.stringify(params)}`;  
}

const regISODate = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;

const dateParser = (key: string, value: any) => {
  if (typeof value === 'string' && regISODate.test(value)) {
    return new Date(value);
  }
  return value;
};

export function JSONParse(str: string) {
  return JSON.parse(str, dateParser);
}
