import * as _ from 'lodash';
import * as program from 'commander';
import {
  ApiError,
  run,
  printList,
  printDoc,
} from './util';

program
  .command('add <name>')
  .option('-d, --desc [text]', 'description text')
  .option('-r, --role <role>', 'client role [user|admin]', 'user')
  .action((name, options) => {
    const doc = {
      name,
      role: options.role,
      description: options.desc,
    };
    run(async app => {
      const { Client } = app.models;
      const instance = await Client.create(doc);
      printDoc(instance.data());
    });
  });

program
  .command('update <name>')
  .option('-d, --desc [text]', 'description text')
  .option('-r, --role <role>', 'client role [user|admin]', 'user')
  .action((name, options) => {
    const update = {
      role: options.role,
      description: options.desc,
    };
    run(async app => {
      const { Client } = app.models;
      const client = await Client.get({ name });
      if (!client) {
        throw new ApiError(404, 'client not found');
      }
      await client.update({ name }, update);
      printDoc(client.data());
    });
  });

program
  .command('update-secret <name>')
  .action((name) => {
    run(async app => {
      const { Client } = app.models;
      const client = await Client.get({ name });
      if (!client) {
        throw new ApiError(404, 'client not found');
      }
      await client.updateSecret();
      printDoc(client.data());
    });
  });

program
  .command('update-auth <name>')
  .action((name) => {
    run(async app => {
      const { Client } = app.models;
      const client = await Client.get({ name });
      if (!client) {
        throw new ApiError(404, 'client not found');
      }
      await client.updateAuth();
      printDoc(client.data());
    });
  });

program
  .command('list')
  .alias('ls')
  .option('-q, --quiet', 'only display names')
  .action((options) => {
    run(async app => {
      const { Client } = app.models;
      const list = await Client.getAll({}, {});
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
      const { Client } = app.models;
      const client = await Client.get({ name }, {});
      if (!client) {
        throw new ApiError(404, 'client not found');
      }
      printDoc(client.data());
    });
  });

program
  .command('create-url <name>')
  .option('-h, --hostname [hostname]', 'server bound hostname')
  .option('-p, --port [port]', 'server bound port')
  .option('-s, --schema [schema]', 'server schema', 'http')
  .option('-e, --entry [entry]', 'server entry', '/api')
  .action((name, options) => {
    run(async app => {
      const { Client } = app.models;
      const client = await Client.get({ name }, {});
      if (!client) {
        throw new ApiError(404, 'client not found');
      }
      const url = client.createUrl({
        hostname: options.hostname,
        port: options.port,
        schema: options.schema,
        entry: options.entry,
      });
      console.log(url);
    });
  });

program
  .command('remove <name>')
  .action((name, options) => {
    run(async app => {
      const { Client } = app.models;
      const { result } = await Client.collection.deleteOne({ name });
      console.log(`${result.n} items removed.`);
    });
  });

program.parse(process.argv);
