#!/usr/bin/env node
import fs from 'fs';
import _ from 'lodash';
import program from 'commander';

const CONFIG_FILE = 'config/custom-environment-variables.js';
const ENV_FILE = '.envrc';
const ENV_TEMPLATE_FILE = '.envrc-template';

function readConfig() {
  const pattern = /^export (\w+)=(.+)?$/;
  let config = [];
  if (!fs.existsSync(ENV_FILE)) {
    return config;
  }
  let content = fs.readFileSync(ENV_FILE, { encoding: 'utf-8' });
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

function writeConfig(config) {
  const pattern = /^(\w+)=(.+)$/;
  let groups = _.groupBy(config, item => item.key.replace(/\_.+$/, ''));
  let content = '';
  _.each(groups, (items, group) => {
    content += `# ${group}\n`;
    _.each(items, item => {
      let { value } = item;
      if (_.isUndefined(value)) {
        value = '';
      }
      content += `export ${item.key}=${value}\n`;
    });
    content += '\n';
  });
  fs.writeFileSync(ENV_FILE, content);
}

function extractConfigKeys() {
  let content = fs.readFileSync(CONFIG_FILE, {encoding: 'utf-8'});
  let keys = [];
  let pattern = /:\s*'([A-Z]\w+)'/g;
  let match = pattern.exec(content);
  while (match) {
    keys.push(match[1]);
    match = pattern.exec(content);
  }
  return keys;
}

function writeEnvConfigFile(groups) {
  let content = '';
  _.each(groups, (keys, group) => {
    content += `# ${group}\n`;
    _.each(keys, key => {
      content += `${key}=\n`;
    });
    content += '\n';
  });
  fs.writeFileSync(ENV_TEMPLATE_FILE, content);
  console.log(`config template updated to ${ENV_TEMPLATE_FILE}`);
}

program
  .command('update-template')
  .description('update config template from default config')
  .action(() => {
    let keys = extractConfigKeys();
    let groups = _.groupBy(keys, key => key.replace(/\_.+$/, ''));
    writeEnvConfigFile(groups);
  });

program
  .command('update')
  .description('sync .env with config')
  .action(() => {
    const config = readConfig();
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
      writeConfig(config);
      console.log(`new config items added: \n${newConfig.join('\n')}`);
    } else {
      console.log('no new config item found, nothing changed');
    }
  });

program
  .command('list')
  .description('print all config values')
  .action(() => {
    let config = readConfig();
    _.each(config, item => {
      const value = _.isUndefined(item.value) ? '' : item.value;
      console.log(`${item.key}=${value}`);
    });
  });

program
  .command('get <key>')
  .description('get config value')
  .action(key => {
    const config = readConfig();
    const item = _.find(config, {key: key});
    const value = item ? item.value : null;
    console.log(value);
  });

program
  .command('remove <key>')
  .description('remove config item')
  .action(key => {
    const config = readConfig();
    const newConfig = _.reject(config, { key: key });
    if (config.length === newConfig.length) {
      console.log(`config item '${key}' not found, nothing changed`);
    } else {
      writeConfig(newConfig);
      console.log(`config item '${key}' removed`);
    }
  });

program
  .command('set <key> <value>')
  .description('set config value')
  .action((key, value) => {
    if (value == null) {
      value = '';
    }
    const config = readConfig();
    const item = _.find(config, {key: key});
    if (item) {
      item.value = value;
    } else {
      config.push({key, value});
    }
    console.log(config);
    writeConfig(config);
    console.log('ok');
  });

program.parse(process.argv);
