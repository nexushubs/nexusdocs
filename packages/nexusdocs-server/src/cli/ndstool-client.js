import _ from 'lodash';
import program from 'commander';
import { makeObject, makeArray, handleError, getApp, listToTable, docToTable, run } from './util';

program
  .command('add <name>')
  .option('-d, --desc [text]', 'description text')
  .option('-a, --admin', 'description text')
  .action((env, options) => {
    const name = program.args[0];
    let doc = {
      name,
      description: options.desc,
      role: options.admin ? 'admin' : 'user',
    };
    run(async app => {
      const { Client } = app.model();
      const instance = await Client.create(doc);
      const table = docToTable(instance.data());
      console.log(table);
    });
  });

program
  .command('ls [name]')
  .option('-l, --detail', 'show detail')
  .action((env, options) => {
    run(async app => {
      const { Client } = app.model();
      const list = await Client.getAll();
      if (options.detail) {
        const table = listToTable(list);
        console.log(table);
      } else {
        console.log(_.map(list, 'name').join('\n'));
      }
      console.log(`${list.length} items listed.`);
    });
  });

program
  .command('remove <clientKey>')
  .action((env, options) => {
    const { args } = program;
    const clientKey = args[0];
    run(async app => {
      const { Client } = app.model();
      const { result } = await Client.collection.remove({ clientKey });
      console.log(`${result.n} items removed.`);
    });
  });

program.parse(process.argv);
