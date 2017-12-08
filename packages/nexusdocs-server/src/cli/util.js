import { ObjectId } from 'mongodb';
import Table from 'cli-table';
import _ from 'lodash';

import Application from '~/init/application';
import { ValidationError } from '~/lib/errors';

let app = null;

const options = {
  cli: true,
  database: {
    mongo: 'mongodb://localhost:27017/nexusdocs',
  },
};

export async function getApp() {
  if (!app) {
    app = new Application(options);
    app.on('error', err => console.error);
    app.on('start', err => console.log('# NexusDocs server tool started'));
    app.on('stop', err => console.log(`# NexusDocs server tool finished in ${app.time()}s`));
    await app.start();
  }
  return app;
}

export async function run(fn) {
  const app = await getApp();
  try {
    await fn(app);
  } catch(e) {
    handleError(e);
  } finally {
    app.stop();
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
  if (err instanceof ValidationError) {
    console.error('Invalid Input:');
    console.error(listToTable(err.errors));
    return;
  }    
  console.error(err);
}

export function listToTable(list) {
  if (!_.isArray(list) || !list.length) {
    return 'no record';
  }
  const table = new Table({ head: _.keys(list[0])});
  list.map(doc => {
    const values = _.values(doc).map(value => {
      if (/^[0-9a-f]{24}/.test(value)) {
        return value.toString();
      } else if (_.isArray(value)) {
        return value;
      } else if (_.isObject(value)) {
        return _.keys(value).length ? '{...}' : '{}';
      } else if (_.isUndefined(value)) {
        return '';
      } else if (_.isNull(value)) {
        return 'null';
      }
      return value;
    });
    table.push(values);
  })
  return table.toString();
}

export function docToTable(doc) {
  return listToTable([doc]);
}
