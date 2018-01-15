import _ from 'lodash';
import program from 'commander';
import {
  run,
  makeObject,
  makeArray,
  printList,
  printDoc,
} from './util';

program
  .command('add <name>')
  .option('-t, --type <type>', 'provider type')
  .option('-p, --params [params]', 'server parameters, foo=1,bar=2', makeObject, {})
  .option('-b, --buckets <buckets>', 'file bucket list, a,b', makeArray, [])
  .option('-d, --desc [text]', 'description text')
  .action((env, options) => {
    const name = program.args[0];
    const doc = {
      name,
      type: options.type,
      params: options.params,
      buckets: options.buckets,
      description: options.desc,
    };
    run(async app => {
      const { Provider } = app.model();
      const instance = await Provider.create(doc);
      printDoc(instance.data());
    });
  });

program
  .command('update <name>')
  .option('-p, --params [params]', 'server parameters, param1=value1,param2=value2', makeObject, {})
  .option('-b, --buckets [buckets]', 'file bucket list, a,b', makeArray, [])
  .option('-d, --desc [text]', 'description text')
  .action((env, options) => {
    const name = program.args[0];
    const update = {
      params: _.isEmpty(options.params) ? undefined : options.params,
      buckets: _.isEmpty(options.buckets) ? undefined : options.buckets,
      description: options.desc,
    };
    run(async app => {
      const { Provider } = app.model();
      const provider = await Provider.get({ name });
      if (!provider) {
        throw new ApiError(404, 'provider not found');
      }
      await provider.update(update);
      printDoc(provider.data());
    });
  });

program
  .command('ls [options]')
  .option('-t, --type <type>', 'provider type')
  .option('-l, --detail', 'show detail')
  .action((env, options) => {
    const name = program.args[0];
    let query = {};
    if (options.type) {
      query.type = options.type;
    }
    run(async app => {
      const { Provider } = app.model();
      const list = await Provider.getAll(query);
      if (options.detail) {
        printList(list)
      } else {
        console.log(_.map(list, 'name').join('\n'));
      }
      console.log(`${list.length} items listed.`);
    });
  });

program
  .command('info <name>')
  .action((env, options) => {
    const name = program.args[0];
    run(async app => {
      const { Provider } = app.model();
      const provider = await Provider.get({ name });
      if (!provider) {
        throw new ApiError(404, 'provider not found');
      }
      printDoc(provider.data());
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
