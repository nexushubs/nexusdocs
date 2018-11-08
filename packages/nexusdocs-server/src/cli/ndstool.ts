import 'source-map-support/register';
import program from 'commander';
import packageJson from '../../package.json';

program
  .version(packageJson.version);

program
  .command('install', 'install default data')
  .command('env', 'manage .env config')
  .command('provider [command]', 'manage provider')
  .command('namespace [command]', 'namespace provider')
  .command('client [command]', 'client manage');

program.parse(process.argv);
