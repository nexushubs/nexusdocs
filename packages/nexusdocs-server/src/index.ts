import 'source-map-support/register';
import config from 'config';
import Application from './lib/Application';
import packageJson from '../package.json';
import { ApplicationOptions } from 'types/index';

export default function createServer(options: ApplicationOptions = null) {
  return new Application(options);
}

const argv = [...process.argv];

if (require.main === module && argv.pop() === 'start') {
  const app = createServer();
  app.on('starting', () => {
    console.log(`# ${packageJson.name}@${packageJson.version}`);
    console.log(`# ${packageJson.description}`);
    console.log(`# MIT license, source code: https://github.com/nexushubs/nexusdocs`);
    console.log('# starting NexusDocs server...');
  })
  app.on('dbconnected', (url) => {
    console.log(`# db connected to ${url.replace(/(?:mongodb(\+srv)?:\/\/)[\w\.]+:[\w%]+@/, '')}`);
  })
  app.on('start', () => {
    const { restful: { hostname, port, serverUrl } } = config.get('Application');
    const seconds = app.time();
    console.log(`# server started successfully in ${seconds}s`);
    console.log(`# api binds to http://${hostname}:${port}/api/`);
    console.log(`# server url is ${serverUrl || 'auto-detect'}`);
  })
  app.on('starting service', () => {
    console.log('# starting sub services ...');
  });
  app.on('stopping', () => {
    console.log('# stopping sub services ...');
  });
  app.on('stop', () => {
    const seconds = app.time();
    console.log('# NexusDocs stopped')
  })
  app.on('error', e => {
    console.error(e);
  })
  app.start();
}
