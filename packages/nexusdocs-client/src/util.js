import qs from 'qs';
import Base64 from 'crypto-js/enc-base64';
import JSONStringify from 'json-stable-stringify';
import isStream from 'is-stream';

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

export function getTimestamp(t) {
  if (typeof t === 'undefined') {
    t = new Date;
  }
  if (t instanceof Date) {
    t = parseInt(t.valueOf() / 1000);
  }
  // if t is before 2017-01-01, assume it is a time period
  if (typeof t === 'number' && t < new Date('2017-01-01').valueOf() / 1000) {
    t = parseInt(Date.now() / 1000) + t;
  }
  return t;
}

export function urlSafeBase64Encode(str) {
  return str
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function sortedJSONStringify(obj) {
  return JSONStringify(obj, (a, b) => a.key < b.key ? 1 : -1);
}

export function sortObjectKey(obj) {
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

const dateParser = (key, value) => {
  if (typeof value === 'string' && regISODate.test(value)) {
    return new Date(value);
  }
  return value;
};

export function JSONParse(str) {
  return JSON.parse(str, dateParser);
}
