import _ from 'lodash';

import { ApiError } from '~/lib/errors';

const regexCommandThumbnail = /(\d+)?x(\d+)?([%@!^<>])?/;
const resizeMethodMap = {
  '!': 'fixed',
  '^': 'mfit',
};
const invalidOptionMessage = 'Invalid converting options';

export default class Converter {
  constructor(inputType, commands, options) {
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
    const params = {};
    const inputs = regexCommandThumbnail.exec(options);
    if (!inputs) {
      throw new ApiError(400, invalidOptionMessage, 'OSS image resizing: invalid image resizing options');
    }
    const [ undefined, width, height, method ] = inputs;
    if (width) {
      width = parseInt(width);
      if (_.isNaN(width)) {
        throw new ApiError(400, invalidOptionMessage, 'OSS image resizing: invalid image width');
      }
      params.w = width;
    }
    if (height) {
      height = parseInt(height);
      if (_.isNaN(height)) {
        throw new ApiError(400, invalidOptionMessage, 'OSS image resizing: invalid image height');
      }
      params.h = height;
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
    if (_.isNaN(quality) || q <= 1 || q >= 100) {
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

export function convert(...args) {
  const converter = new Converter(...args);
  return converter.toString();
}
