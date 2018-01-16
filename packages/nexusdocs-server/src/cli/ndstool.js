import 'source-map-support/register';
import program from 'commander';
import packageConfig from '../../package.json';

program
  .version(packageConfig.version);

program
  .command('install', 'install default data')
  .command('env', 'manage .env config')
  .command('provider [command]', 'manage provider')
  .command('namespace [command]', 'namespace provider')
  .command('client [command]', 'client manage');

program.parse(process.argv);
