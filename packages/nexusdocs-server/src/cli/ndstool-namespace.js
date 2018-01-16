import _ from 'lodash';
import program from 'commander';
import boolean from 'boolean';

import {
  ApiError,
  run,
  printList,
  printDoc,
} from './util';

program
  .command('add <name>')
  .option('-p, --provider <name>', 'namespace')
  .option('-b, --bucket <bucket>', 'bucket name')
  .option('-p, --public', 'namespace is public')
  .option('-d, --dest <text>', 'description text')
  .action((name, options) => {
    let doc = {
      name,
      provider: options.provider,
      bucket: options.bucket,
      description: options.dest,
      isPublic: !!options.public,
    };
    run(async app => {
      const { Namespace } = app.model();
      const instance = await Namespace.createByProviderName(doc);
      const table = listToTable([instance.data()]);
      console.log(table);
    });
  });

program
  .command('update <name>')
  .option('-p, --provider [name]', 'namespace')
  .option('-b, --bucket [bucket]', 'bucket name')
  .option('-p, --public [bool]', 'namespace is public')
  .option('-d, --dest [text]', 'description text')
  .action((name, options) => {
    const update = {
      provider: options.provider,
      bucket: options.bucket,
      public: _.isUndefined(options.public) ? undefined : boolean(options.public),
      description: options.desc,
    };
    run(async app => {
      const { Namespace } = app.model();
      const namespace = await Namespace.get({ name });
      if (!namespace) {
        throw new ApiError(404, 'namespace not found');
      }
      await namespace.update(update);
      printDoc(namespace.data());
    });
  });

program
  .command('list')
  .alias('ls')
  .option('-t, --type <type>', 'namespace type')
  .option('-q, --quiet', 'only display names')
  .action((options) => {
    run(async app => {
      const { Namespace } = app.model();
      const list = await Namespace.getAll();
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
  .action((name) => {
    run(async app => {
      const { Namespace } = app.model();
      const namespace = await Namespace.get({ name });
      if (!namespace) {
        throw new ApiError(400, 'namespace not found');
      }
      printDoc(namespace.data());
    });
  });

program
  .command('remove <name>')
  .action((name) => {
    run(async app => {
      const { Namespace } = app.model();
      const { result } = await Namespace.collection.remove({ name });
      console.log(`${result.n} items removed.`);
    });
  });

program.parse(process.argv);
