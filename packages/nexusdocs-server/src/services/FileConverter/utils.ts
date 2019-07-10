import * as _ from 'lodash';
import { IConvertingCommands } from './types';

export class Commands {

  static stringify(commands: IConvertingCommands): string {
    return '/' + _.flatten(_.toPairs(commands)).join('/');
  }

  static parse(commands: string): IConvertingCommands {
    return _.fromPairs(_.chunk(commands.split('/'), 2));
  }

}

export function getCacheKey(key: string, commands: IConvertingCommands) {
  return `:${key}:${Commands.stringify(commands)}`;
}

export function getContentType(ext: string) {

}
