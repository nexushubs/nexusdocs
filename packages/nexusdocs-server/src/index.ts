import 'source-map-support/register';
import * as config from 'config';
import Application from './lib/Application';
import { ApplicationOptions } from './types';
const packageJson = require('../package.json');

export default function createServer(options: ApplicationOptions = null) {
  return new Application(options);
}

const argv = [...process.argv];

if (require.main === module && argv.pop() === 'start') {
  const app = createServer();
  app.on('starting', () => {
    console.log(`[INFO] ${packageJson.name}@${packageJson.version}`);
    console.log(`[INFO] ${packageJson.description}`);
    console.log(`[INFO] MIT license, source code: https://github.com/nexushubs/nexusdocs`);
    console.log('[INFO] starting NexusDocs server...');
  })
  app.on('dbconnected', (url) => {
    console.log(`[INFO] db connected to ${url.replace(/(?:mongodb(\+srv)?:\/\/)[\w\.]+:[\w%]+@/, '')}`);
  })
  app.on('start', () => {
    const { restful: { hostname, port, serverUrl } } = config.get('Application');
    const seconds = app.time();
    console.log(`[INFO] server started successfully in ${seconds}s`);
    console.log(`[INFO] api binds to http://${hostname}:${port}/api/`);
    console.log(`[INFO] server url is ${serverUrl || 'auto-detect'}`);
  })
  app.on('starting service', () => {
    console.log('[INFO] starting sub services ...');
  });
  app.on('stopping', () => {
    console.log('[INFO] stopping sub services ...');
  });
  app.on('stop', () => {
    const seconds = app.time();
    console.log(`[INFO] NexusDocs server stopped, lasted ${seconds} seconds`);
  })
  app.on('error', e => {
    console.error(e);
  })
  app.start();
}
