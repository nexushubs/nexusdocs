import * as _ from 'lodash';

import { ApiError } from '../../../../cli/util';

const regexCommandThumbnail = /(\d+)?x(\d+)?([%@!^<>])?/;
const resizeMethodMap = {
  '!': 'fixed',
  '^': 'mfit',
};
const invalidOptionMessage = 'Invalid converting options';

export default class Converter {

  private commands: string[][];
  private inputType: string;
  private options: any;
  private output: any;

  constructor(inputType: string, commands: string, options: any) {
    this.commands = _.chunk(commands.split('/'), 2);
    this.inputType = inputType;
    this.options = options;
    this.output = {};
    this.parse();
  }

  parse() {
    _.each(this.commands, ([command, options]) => {
      const method = `_${command}`;
      if (this[method]) {
        this[method](options);
      } else {
        throw new ApiError(400, invalidOptionMessage, `OSS image: unknown option ${command}`);
      }
    });
  }

  _resize(options) {
    const params: {[key: string]: any} = {};
    const inputs = regexCommandThumbnail.exec(options);
    if (!inputs) {
      throw new ApiError(400, invalidOptionMessage, 'OSS image resizing: invalid image resizing options');
    }
    const [ undefined, width, height, method ] = inputs;
    if (width) {
      const widthValue = parseInt(width);
      if (widthValue === NaN) {
        throw new ApiError(400, invalidOptionMessage, 'OSS image resizing: invalid image width');
      }
      params.w = widthValue;
    }
    if (height) {
      const heightValue = parseInt(height);
      if (heightValue === NaN) {
        throw new ApiError(400, invalidOptionMessage, 'OSS image resizing: invalid image height');
      }
      params.h = heightValue;
    }
    if (method) {
      const m = resizeMethodMap[method];
      if (m) {
        params.m = m;
      } else if (method === '%') {
        const size = width || height;
        if (_.isNaN(size)) {
          throw new ApiError(400, invalidOptionMessage, 'OSS image resizing: invalid percentage');
        }
        delete params.w;
        delete params.h;
        params.p = size;
      } else if (method === '>') {
        params.limit = 1;
      } else {
        throw new ApiError(400, invalidOptionMessage, 'OSS image resizing: fitting method is invalid or not supported');
      }
    }
    const p = [];
    _.each(params, (value, key) => {
      p.push(`${key}_${value}`);
    });
    this.output.resize = p.join(',');
  }

  _rotate(r) {
    if (r === 'auto') {
      this.output['auto-orient'] = 1;
    } else {
      r = parseInt(r);
      if (_.isNaN(r) || r % 90 !== 0) {
        throw new ApiError(400, invalidOptionMessage, 'OSS image rotating: invalid degrees [0~360]');
      }
      this.output.rotate = r;
    }
  }

  _format(type) {
    const { supportedOutputTypes = [] } = this.options;
    if (type === 'jpeg') {
      type = 'jpg';
    }
    if (!supportedOutputTypes.includes(type)) {
      throw new ApiError(400, invalidOptionMessage, 'OSS image format: unsupported file type');
    }
    this.output.format = type;
  }

  _quality(q) {
    q = parseInt(q);
    if (_.isNaN(q) || q <= 1 || q >= 100) {
      throw new ApiError(400, invalidOptionMessage, 'OSS image quality: invalid or out of range (1~100)');
    }
    this.output.quality = `Q_${q}`;
  }

  toString() {
    const outputType = this.output.format || this.inputType;
    if (this.output.q && !['jpg', 'webp'].includes(outputType)) {
      throw new ApiError(400, invalidOptionMessage, 'OSS image quality: the format does not support quality option');
    }
    let str = 'image';
    _.each(this.output, (value, key) => {
      str += `/${key},${value}`;
    });
    return str;
  }
}

export function convert(inputType: string, commands: string, options: any) {
  const converter = new Converter(inputType, commands, options);
  return converter.toString();
}
