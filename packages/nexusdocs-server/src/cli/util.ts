import 'source-map-support/register';
import * as _ from 'lodash';
import Table from 'cli-table';
import { ObjectId } from 'mongodb';

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

export async function run(fn: (app: Application) => void) {
  const app = await getApp();
  try {
    await fn(app);
  } catch(e) {
    handleError(e);
  } finally {
    console.log('# done!');
    app.stop(true);
  }
}

export function makeObject(val) {
  const params = {};
  val.split(',').forEach(arg => {
    const [key, value] = arg.split('=');
    params[key] = value;
  });
  return params;
}

export function makeArray(val) {
  return val.split(',');
}

export function handleError(err) {
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
  }    
  console.error(err);
}

export function listToTable(list) {
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

export function printList(list) {
  const table = listToTable(list);
  console.log(table);
}

export function mongoJSONReplacer(key, value) {
  if (value instanceof ObjectId || /^[0-9a-f]{24}$/i.test(value)) {
    return `ObjectId('${value.valueOf()}')`;
  } else if (value instanceof Date) {
    return `ISODate('${value.toISOString()}')`;
  }
  return value;
}

export function mongoJSONStringify(doc, replacer = null, space = 2) {
  if (!replacer) {
    replacer = mongoJSONReplacer;
  }
  return JSON.stringify(doc, replacer, space)
    .replace(/"ObjectId\('([^)]+)'\)"/g, 'ObjectId("$1")')
    .replace(/"ISODate\('([^)]+)'\)"/g, 'ISODate("$1")');
}

export function printDoc(doc) {
  // const json = mongoJSONStringify(doc);
  // console.log(json);
  printList([doc]);
}

export async function printCollection(db, name) {
  const list = await db.collection(name).find({}).toArray();
  const table = listToTable(list);
  console.log(`collection '${name}' (${list.length} docs):`);
  console.log(table);
}
