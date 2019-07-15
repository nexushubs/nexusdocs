import 'source-map-support/register';
import * as _ from 'lodash';
import { ObjectId, Db } from 'mongodb';
import Table = require('cli-table');

import Application from '../lib/Application';
import { ApiError, ValidationError } from '../lib/errors';
export { ApiError } from '../lib/errors';

const MAX_CELL_CONTENT = 256;

let app = null;

export async function getApp(): Promise<Application> {
  if (!app) {
    app = new Application({ restful: { enabled: false }});
    app.on('error', err => console.error);
    app.on('start', err => console.log('# NexusDocs server tool started'));
    app.on('stop', err => console.log(`# NexusDocs server tool finished in ${app.time()}s`));
    await app.start();
  }
  return app;
}

export async function run(fn: () => void) {
  let err: Error;
  try {
    fn();
  } catch(e) {
    err = e;
    handleError(e);
  } finally {
    if (err) {
      process.exit(1);
    }
  }
}

export async function runInApp(fn: (app: Application) => void) {
  const app = await getApp();
  let err: Error;
  try {
    await fn(app);
  } catch(e) {
    err = e;
    handleError(e);
  } finally {
    console.log('# done!');
    await app.stop(true);
    if (err) {
      process.exit(1);
    }
  }
}

export function makeObject(val: string) {
  const params = {};
  val.split(',').forEach(arg => {
    const [key, value] = arg.split('=');
    params[key] = value;
  });
  return params;
}

export function makeArray(val: string) {
  return val.split(',');
}

export class CmdError extends Error {
  
}

export function handleError(err: Error) {
  if (err instanceof ApiError) {
    console.error('Error:', err.message);
    return;
  } else if (err instanceof ValidationError) {
    console.error('Invalid Input:');
    _.each(err.errors, e => {
      delete e.code;
    });
    console.error(listToTable(err.errors));
    return;
  } else if (err instanceof CmdError) {
    console.error(err.message);
    return;
  }
  console.error(err);
}

export function listToTable<T>(list: T) {
  if (!_.isArray(list) || !list.length) {
    return 'no record';
  }
  const head = _.keys(list[0]);
  const table = new Table({ head });
  list.map(doc => {
    const values = [];
    _.each(head, key => {
      let value = doc[key];
      if (/^[0-9a-f]{24}$/i.test(value)) {
        value = mongoJSONStringify(value);
        // value = value.toString();
      } else if (_.isObject(value)) {
        const v = mongoJSONStringify(value);
        if (v.length > MAX_CELL_CONTENT) {
          value = `${v.slice(0, MAX_CELL_CONTENT - 5)} ...${v.slice(-1)}`;
        } else {
          value = v;
        }
      } else if (_.isUndefined(value)) {
        value = '';
      } else if (_.isNull(value)) {
        value = 'null';
      }
      values.push(value);
    });
    table.push(values);
  })
  return table.toString();
}

export function printList<T>(list: T) {
  const table = listToTable<T>(list);
  console.log(table);
}

export function mongoJSONReplacer(key: string, value: any) {
  if (value instanceof ObjectId || /^[0-9a-f]{24}$/i.test(value)) {
    return `ObjectId('${value.valueOf()}')`;
  } else if (value instanceof Date) {
    return `ISODate('${value.toISOString()}')`;
  }
  return value;
}

export function mongoJSONStringify(doc: any, replacer = null, space = 2) {
  if (!replacer) {
    replacer = mongoJSONReplacer;
  }
  return JSON.stringify(doc, replacer, space)
    .replace(/"ObjectId\('([^)]+)'\)"/g, 'ObjectId("$1")')
    .replace(/"ISODate\('([^)]+)'\)"/g, 'ISODate("$1")');
}

export function printDoc(doc: any) {
  // const json = mongoJSONStringify(doc);
  // console.log(json);
  printList([doc]);
}

export async function printCollection(db: Db, name: string) {
  const list = await db.collection(name).find({}).toArray();
  const table = listToTable(list);
  console.log(`collection '${name}' (${list.length} docs):`);
  console.log(table);
}
