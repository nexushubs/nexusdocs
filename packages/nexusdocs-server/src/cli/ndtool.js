import program from 'commander';

program
  .version('1.0.0')

program
  .command('provider [command]', 'manage provider')
  .command('namespace [command]', 'namespace provider');

program.parse(process.argv);
