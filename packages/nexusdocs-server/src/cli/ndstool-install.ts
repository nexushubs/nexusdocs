import * as _ from 'lodash';
import * as path from 'path';
import * as config from 'config';
import * as program from 'commander';
import { execFileSync } from 'child_process';
import {
  run,
  printCollection,
} from './util';

program
  .option('-f, --force', 'install and overwrite existing')
  .option('-d, --database [url]', 'database base url [mongodb://127.0.0.1/]');

function install() {
  run(async app => {
    const { db } = app;
    const { Provider, Namespace, Client } = app.models;
    let database = program.database;
    if (!program.database) {
      const { database: _database } = config.get('Application');
      database = _database.replace(/\/\w+$/, '');
    }
    const tasks = [];
    tasks.push({
      description: 'creating provider: default',
      task: () => Provider.create({
        name: 'default',
        type: 'gridfs',
        params: {
          database: 'ndsfile',
        },
        buckets: ['public', 'private'],
        description: 'Default provider',
      }),
    });
    tasks.push({
      description: 'creating provider: nexusdocs',
      task: () => Provider.create({
        name: 'nexusdocs',
        type: 'gridfs',
        params: {
          database: 'ndscache',
        },
        buckets: ['cache'],
        description: 'nexusdocs cache provider',
      }),
    });
    tasks.push({
      description: 'creating namespace: default > public',
      task: () => Namespace.createByProviderName({
        name: 'public',
        provider: 'default',
        bucket: 'public',
        isPublic: true,
        description: 'default namespace for storing public files by GridFS'
      }),
    });
    tasks.push({
      description: 'creating namespace: default > private',
      task: () => Namespace.createByProviderName({
        name: 'private',
        provider: 'default',
        bucket: 'private',
        isPublic: false,
        description: 'default namespace for storing private files by GridFS'
      }),
    });
    tasks.push({
      description: 'creating namespace: nexushubs.cache',
      task: () => Namespace.createByProviderName({
        name: 'nexusdocs.cache',
        provider: 'nexusdocs',
        bucket: 'cache',
        isSystem: true,
        description: "NexusDocs cache namespace"
      }),
    });
    tasks.push({
      description: 'creating client: default user role',
      task: () => Client.create({
        name: 'user',
        role: 'user',
        description: 'default client of <user> role',
      }),
    });
    tasks.push({
      description: 'creating client: default admin role',
      task: () => Client.create({
        name: 'admin',
        role: 'admin',
        description: 'default client of <admin> role',
      }),
    });
    tasks.push({
      description: 'creating elasticsearch indices',
      task: () => {
        execFileSync('./init', ['docs.files' ,'docs'], {
          cwd: path.normalize(`${__dirname}/../../data/elasticsearch`),
        });
      }
    })
    let hasError = false;
    let runner = Promise.resolve();
    console.log('writing initializing data');
    _.each(tasks, ({ description, task }, index) => {
      runner = runner.then(() => {
        if (index > 0) {
          process.stdout.write(' done!\n');
        }
        process.stdout.write(`[${index + 1}/${tasks.length}] ${description} ...`);
        return task();
      })
      .catch(error => {
        hasError = true;
        console.error(`error running '${description}'`);
        console.error(error);
      });
    });
    await runner;
    process.stdout.write(' done!\n');
    await printCollection(db, Provider.collection.collectionName);
    await printCollection(db, Namespace.collection.collectionName);
    await printCollection(db, Client.collection.collectionName);
    if (!hasError) {
      console.log('initial data installed successfully!');
    } else {
      console.log('initial data installation error!');
    }
  });
}

program.parse(process.argv);

install();
