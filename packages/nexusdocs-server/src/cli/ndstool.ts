import 'source-map-support/register';
import * as program from 'commander';
const packageJson = require('../../package.json');

program
  .version(packageJson.version);

program
  .command('install', 'install default data')
  .command('env', 'manage .env config')
  .command('provider [command]', 'manage provider')
  .command('namespace [command]', 'namespace provider')
  .command('client [command]', 'client manage');

program.parse(process.argv);
