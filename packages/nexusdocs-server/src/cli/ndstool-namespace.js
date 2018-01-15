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
  .action((env, options) => {
    const name = program.args[0];
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
  .action((env, options) => {
    const name = program.args[0];
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
  .command('ls [options]')
  .option('-t, --type <type>', 'namespace type')
  .option('-l, --detail', 'show detail')
  .action((env, options) => {
    run(async app => {
      const { Namespace } = app.model();
      const list = await Namespace.getAll();
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
