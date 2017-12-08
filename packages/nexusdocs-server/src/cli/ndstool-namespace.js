import _ from 'lodash';
import program from 'commander';

import { makeObject, makeArray, handleError, getApp, listToTable, run } from './util';

program
  .command('add <name>')
  .option('-p, --provider <name>', 'namespace')
  .option('-b, --bucket <bucket>', 'bucket name')
  .option('-d, --dest <text>', 'description text')
  .action((env, options) => {
    const name = program.args[0];
    let doc = {
      name,
      provider: options.provider,
      bucket: options.bucket,
      description: options.dest,
    };
    run(async app => {
      const { Namespace } = app.model();
      const instance = await Namespace.createByProviderName(doc);
      const table = listToTable([instance.data()]);
      console.log(table);
    });
  });

program
  .command('ls [name]')
  .option('-t, --type <type>', 'namespace type')
  .option('-l, --detail', 'show detail')
  .action((env, options) => {
    run(async app => {
      const { Namespace } = app.model();
      const list = await Namespace.getAll();
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
  .command('remove <name>')
  .action((env, options) => {
    const { args } = program;
    const name = args[0];
    run(async app => {
      const { Namespace } = app.model();
      const { result } = await Namespace.collection.remove({name: name});
      console.log(`${result.n} items removed.`);
    });
  });

program.parse(process.argv);
