import * as _ from 'lodash';
import * as program from 'commander';
import { boolean } from 'boolean';

import {
  ApiError,
  runInApp,
  printList,
  printDoc,
  mongoJSONStringify,
} from './util';

program
  .command('add <name>')
  .option('-p, --provider <name>', 'namespace')
  .option('-b, --bucket <bucket>', 'bucket name')
  .option('-p, --public [bool]', 'namespace is public')
  .option('-d, --desc <text>', 'description text')
  .action((name, options) => {
    let doc = {
      name,
      provider: options.provider,
      bucket: options.bucket,
      description: options.desc,
      isPublic: _.isUndefined(options.public) ? undefined : boolean(options.public),
    };
    runInApp(async app => {
      const { Namespace } = app.models;
      const instance = await Namespace.createByProviderName(doc);
      printDoc(instance.data());
    });
  });

program
  .command('update <name>')
  .option('-p, --provider [name]', 'namespace')
  .option('-b, --bucket [bucket]', 'bucket name')
  .option('-p, --public [bool]', 'namespace is public')
  .option('-d, --desc [text]', 'description text')
  .action((name, options) => {
    const update = {
      provider: options.provider,
      bucket: options.bucket,
      isPublic: _.isUndefined(options.public) ? undefined : boolean(options.public),
      description: options.desc,
    };
    runInApp(async app => {
      const { Namespace } = app.models;
      const namespace = await Namespace.get({ name });
      if (!namespace) {
        throw new ApiError(404, 'namespace not found');
      }
      await namespace.update({ name }, update);
      printDoc(namespace.data());
    });
  });

program
  .command('list')
  .alias('ls')
  .option('-t, --type <type>', 'namespace type')
  .option('-q, --quiet', 'only display names')
  .action((options) => {
    runInApp(async app => {
      const { Namespace } = app.models;
      const list = await Namespace.collection.find({}).toArray();
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
    runInApp(async app => {
      const { Namespace } = app.models;
      const namespace = await Namespace.get({ name });
      if (!namespace) {
        throw new ApiError(404, 'namespace not found');
      }
      const info = await namespace.getStats();
      printDoc(namespace.data());
      console.log('statistics:', mongoJSONStringify(info));
    });
  });

program
  .command('remove <name>')
  .action((name) => {
    runInApp(async app => {
      const { Namespace } = app.models;
      const namespace = await Namespace.get({ name });
      if (!namespace) {
        throw new ApiError(404, 'namespace not found');
      }
      const info = await namespace.getStats();
      if (info.files.count > 0 || info.stores.count > 0) {
        throw new ApiError(400, 'There are files in the namespace, could not remove!');
      }
      const result = await Namespace.collection.deleteOne({ name });
      console.log(`namespace ${namespace.name} removed!`);
    });
  });

program.parse(process.argv);
