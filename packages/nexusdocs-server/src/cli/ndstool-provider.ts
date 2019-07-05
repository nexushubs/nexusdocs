import * as _ from 'lodash';
import * as program from 'commander';
import {
  run,
  makeObject,
  makeArray,
  printList,
  printDoc,
} from './util';
import { ApiError } from '../lib/errors';

program
  .command('add <name>')
  .option('-t, --type <type>', 'provider type')
  .option('-p, --params [params]', 'server parameters, foo=1,bar=2', makeObject, {})
  .option('-b, --buckets <buckets>', 'file bucket list, a,b', makeArray, [])
  .option('-d, --desc [text]', 'description text')
  .action((name, options) => {
    const doc = {
      name,
      type: options.type,
      params: options.params,
      buckets: options.buckets,
      description: options.desc,
    };
    run(async app => {
      const { Provider } = app.models;
      const instance = await Provider.create(doc);
      printDoc(instance.data());
    });
  });

program
  .command('update <name>')
  .option('-p, --params [params]', 'server parameters, param1=value1,param2=value2', makeObject, {})
  .option('-b, --buckets [buckets]', 'file bucket list, a,b', makeArray, [])
  .option('-d, --desc [text]', 'description text')
  .action((name, options) => {
    const update = {
      params: _.isEmpty(options.params) ? undefined : options.params,
      buckets: _.isEmpty(options.buckets) ? undefined : options.buckets,
      description: options.desc,
    };
    run(async app => {
      const { Provider } = app.models;
      const provider = await Provider.get({ name });
      if (!provider) {
        throw new ApiError(404, 'provider not found');
      }
      await provider.update({ name }, update);
      printDoc(provider.data());
    });
  });

program
  .command('list')
  .alias('ls')
  .option('-t, --type <type>', 'provider type')
  .option('-q, --quiet', 'only display names')
  .action((options) => {
    let query: any = {};
    if (options.type) {
      query.type = options.type;
    }
    run(async app => {
      const { Provider } = app.models;
      const list = await Provider.collection.find({}).toArray();
      if (!options.quiet) {
        printList(list)
        console.log(`${list.length} items listed.`);
      } else {
        console.log(_.map(list, 'name').join('\n'));
      }
    });
  });

program
  .command('info <name>')
  .action((name, options) => {
    run(async app => {
      const { Provider } = app.models;
      const provider = await Provider.get({ name });
      if (!provider) {
        throw new ApiError(404, 'provider not found');
      }
      printDoc(provider.data());
    });
  });

program
  .command('remove <name>')
  .action((name) => {
    run(async app => {
      const { Provider } = app.models;
      const { result } = await Provider.collection.deleteOne({ name });
      console.log(`${result.n} items removed.`);
    });
  });

program.parse(process.argv);
