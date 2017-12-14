import 'source-map-support/register';
import config from 'config';
import Application from '~/init/application';
import packageConfig from '../package.json';


export default function createServer(options = {}) {
  return new Application({
    ...options,
    version: packageConfig.version,
  });
}

const argv = [...process.argv];

if (require.main === module && argv.pop() === 'start') {
  const app = createServer();
  app.on('init', () => {
    console.log(`# nexusdocs-server@${packageConfig.version} the file storage bridge /TTT\\`);
    console.log(`# MIT license, source code: https://github.com/nexushubs/nexusdocs`);
    console.log('# starting NexusDocs server...');
  })
  app.on('start', () => {
    const { restful: { hostname, port } } = config.get('Application');
    const seconds = app.time();
    console.log(`# server started successfully in ${seconds}s`);
    console.log(`# api binds to http://${hostname}:${port}/api/`);
  })
  app.on('starting service', () => {
    console.log('# starting sub services ...');
  });
  app.on('stop', () => {
    const seconds = app.time();
    console.log('# stopping NexusDocs...')
  })
  app.on('stopping service', () => {
    console.log('# stopping sub services ...');
  });
  app.on('error', e => {
    console.error(e);
  })
  app.start();
}
