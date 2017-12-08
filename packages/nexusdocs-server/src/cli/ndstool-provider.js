import _ from 'lodash';
import program from 'commander';
import { makeObject, makeArray, handleError, getApp, listToTable, docToTable, run } from './util';

program
  .command('add <name>')
  .option('-t, --type <type>', 'provider type')
  .option('-p, --params [params]', 'server parameters, foo=1,bar=2', makeObject, {})
  .option('-b, --buckets <buckets>', 'file bucket list, a,b', makeArray, {})
  .option('-d, --desc [text]', 'description text')
  .action((env, options) => {
    const name = program.args[0];
    let doc = {
      name,
      type: options.type,
      params: options.params,
      buckets: options.buckets,
      description: options.desc,
    };
    run(async app => {
      const { Provider } = app.model();
      const instance = await Provider.create(doc);
      const table = docToTable(instance.data());
      console.log(table);
    });
  });

program
  .command('ls [name]')
  .option('-t, --type <type>', 'provider type')
  .option('-l, --detail', 'show detail')
  .action((env, options) => {
    run(async app => {
      const { Provider } = app.model();
      const list = await Provider.getAll();
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
      const { Provider } = app.model();
      const { result } = await Provider.collection.remove({name: name});
      console.log(`${result.n} items removed.`);
    });
  });

program.parse(process.argv);
