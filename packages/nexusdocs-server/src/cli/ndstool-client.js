import _ from 'lodash';
import program from 'commander';
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
  .action((env, options) => {
    const name = program.args[0];
    const doc = {
      name,
      role: options.role,
      description: options.desc,
    };
    run(async app => {
      const { Client } = app.model();
      const instance = await Client.create(doc);
      printDoc(instance.data());
    });
  });

program
  .command('update <name>')
  .option('-d, --desc [text]', 'description text')
  .option('-r, --role <role>', 'client role [user|admin]', 'user')
  .action((env, options) => {
    const name = program.args[0];
    const update = {
      role: options.role,
      description: options.desc,
    };
    run(async app => {
      const { Client } = app.model();
      const client = await Client.get({ name });
      if (!client) {
        throw new ApiError(404, 'client not found');
      }
      await client.update(update);
      printDoc(client.data());
    });
  });

program
  .command('update-secret <name>')
  .action((env, options) => {
    const name = program.args[0];
    run(async app => {
      const { Client } = app.model();
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
  .action((env, options) => {
    const name = program.args[0];
    run(async app => {
      const { Client } = app.model();
      const client = await Client.get({ name });
      if (!client) {
        throw new ApiError(404, 'client not found');
      }
      await client.updateAuth();
      printDoc(client.data());
    });
  });

program
  .command('ls [options]')
  .option('-l, --detail', 'show detail')
  .action((env, options) => {
    run(async app => {
      const { Client } = app.model();
      const list = await Client.getAll({}, {});
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
      const { Client } = app.model();
      const client = await Client.get({ name }, {});
      if (!client) {
        throw new ApiError(404, 'client not found');
      }
      printDoc(client.data());
    });
  });

program
  .command('remove <name>')
  .action((env, options) => {
    const { args } = program;
    const name = args[0];
    run(async app => {
      const { Client } = app.model();
      const { result } = await Client.collection.remove({ name });
      console.log(`${result.n} items removed.`);
    });
  });

program.parse(process.argv);
