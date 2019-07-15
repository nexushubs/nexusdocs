#!/usr/bin/env node
import * as fs from 'fs';
import * as _ from 'lodash';
import * as flatten from 'flat';
import * as program from 'commander';
import { CmdError, run } from './util';

interface EnvFileConfig {
  file: string,
  template: string,
}
type EnvMode = 'dotenv' | 'direnv';

const CONFIG_FILE = `${__dirname}/../../config/custom-environment-variables.js`;
const ENV_FILES: {[key in EnvMode]: EnvFileConfig}  = {
  dotenv: {
    file: '.env',
    template: '.env-template',
  },
  direnv: {
    file: '.envrc',
    template: '.envrc-template',
  },
}

function getFileName(mode: EnvMode = 'direnv', template?: boolean) {
  const profile = ENV_FILES[mode];
  if (!profile) {
    throw new CmdError('invalid file mode');
  }
  return template ? profile.template : profile.file;
}

function readConfig(mode: EnvMode) {
  const pattern = mode === 'direnv' ? /^export (\w+)=(.+)?$/ : /^(\w+)=(.+)?$/;
  const file = getFileName(mode);
  let config = [];
  if (!fs.existsSync(file)) {
    return config;
  }
  let content = fs.readFileSync(file, { encoding: 'utf-8' });
  let lines = content.split('\n');
  _.each(lines, line => {
    let result = pattern.exec(line);
    if (result) {
      if (_.find(config, item => item.key === result[1])) {
        return;
      }
      config.push({
        key: result[1],
        value: result[2],
      });
    }
  });
  return config;
}

function writeConfig(mode: EnvMode, config: any) {
  const file = getFileName(mode);
  const original = require(CONFIG_FILE);
  const pathMap = _.mapValues(_.invert(flatten(original)), v => v.replace(/\.\w+$/, ''));
  let groups = _.groupBy(config, item => pathMap[item.key]);
  let content = '';
  _.each(groups, (items, group) => {
    content += `# ${group}\n`;
    _.each(items, item => {
      let { value } = item;
      if (_.isUndefined(value)) {
        value = '';
      }
      content += `${mode === 'direnv' ? 'export ' : ''}${item.key}=${value}\n`;
    });
    content += '\n';
  });
  fs.writeFileSync(file, content);
}

function extractConfigKeys() {
  const content = fs.readFileSync(CONFIG_FILE, {encoding: 'utf-8'});
  const keys = [];
  const pattern = /:\s*'([A-Z]\w+)'/g;
  let match = pattern.exec(content);
  while (match) {
    keys.push(match[1]);
    match = pattern.exec(content);
  }
  return keys;
}

function writeEnvConfigFile(mode: EnvMode, groups: any) {
  const file = getFileName(mode, true)
  let content = '';
  _.each(groups, (keys, group) => {
    content += `# ${group}\n`;
    _.each(keys, key => {
      content += `${key}=\n`;
    });
    content += '\n';
  });
  fs.writeFileSync(file, content);
  console.log(`config template updated to ${file}`);
}

const modeOptions: [string, string, string] = ['-m, --mode <mode>', '.env or .envrc to use', 'direnv'];

program
  .command('update-template')
  .description('update .envrc-template from default config')
  .option(...modeOptions)
  .action(({ mode }) => {
    let keys = extractConfigKeys();
    let groups = _.groupBy(keys, key => key.replace(/\_.+$/, ''));
    writeEnvConfigFile(mode, groups);
  });

program
  .command('update')
  .description('sync .envrc with config')
  .option(...modeOptions)
  .action(({ mode }) => {
    run(() => {
      const config = readConfig(mode);
      const currentKeys = _.map(config, 'key');
      const keys = extractConfigKeys();
      const newConfig = [];
      _.each(keys, key => {
        if (!_.includes(currentKeys, key)) {
          newConfig.push(`${key}=`);
          config.push({key, value: ''});
        }
      });
      if (newConfig.length > 0) {
        writeConfig(mode, config);
        console.log(`new config items added: \n${newConfig.join('\n')}`);
      } else {
        console.log('no new config item found, nothing changed');
      }
    })
  });

program
  .command('list')
  .description('print all config values')
  .option(...modeOptions)
  .action(({ mode }) => {
    run(() => {
      let config = readConfig(mode);
      _.each(config, item => {
        const value = _.isUndefined(item.value) ? '' : item.value;
        console.log(`${item.key}=${value}`);
      });
    })
  });

program
  .command('get <key>')
  .description('get config value')
  .option(...modeOptions)
  .action((key, { mode }) => {
    run(() => {
      const config = readConfig(mode);
      const item = _.find(config, {key: key});
      const value = item ? item.value : null;
      console.log(value);
    });
  });

program
  .command('remove <key>')
  .description('remove config item')
  .option(...modeOptions)
  .action((key, { mode }) => {
    run(() => {
      const config = readConfig(mode);
      const newConfig = _.reject(config, { key: key });
      if (config.length === newConfig.length) {
        console.log(`config item '${key}' not found, nothing changed`);
      } else {
        writeConfig(mode, newConfig);
        console.log(`config item '${key}' removed`);
      }
    });
  });

program
  .command('set <key> <value>')
  .description('set config value')
  .option(...modeOptions)
  .action((key, value, { mode }) => {
    run(() => {
      if (value == null) {
        value = '';
      }
      const config = readConfig(mode);
      const item = _.find(config, {key: key});
      if (item) {
        item.value = value;
      } else {
        config.push({key, value});
      }
      console.log(config);
      writeConfig(mode, config);
      console.log('ok');
    });
  });

program.parse(process.argv);
