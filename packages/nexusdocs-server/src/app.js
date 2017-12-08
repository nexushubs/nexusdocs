import Application from '~/init/application';
import 'source-map-support/register';

const options = {
  server: {
    hostname: '127.0.0.1',
    port: 4000,
  },
  database: {
    mongo: 'mongodb://localhost:27017/nexusdocs',
  },
};

const app = new Application(options);
export default app;

app.on('init', () => {
  console.log('# starting NexusDocs server...');
})
app.on('start', () => {
  const seconds = app.time();
  console.log(`# server started successfully in ${seconds}s`);
  console.log(`# api binds to http://${options.server.hostname}:${options.server.port}/api/`);
})
app.on('stop', () => {
  const seconds = app.time();
  console.log('# stopping NexusDocs...')
})
app.on('error', e => {
  console.error(e);
})
app.start();
