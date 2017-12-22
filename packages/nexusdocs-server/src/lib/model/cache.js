import _ from 'lodash';
import { Writable } from 'stream';
import archiver from 'archiver';
import getNewFilename from 'new-filename';
import { PassThrough } from 'stream';

import BaseModel from '~/lib/base-model';
import { bucketName, isObjectId } from '~/lib/schema';
import { ValidationError, buildValidationError } from '~/lib/errors';
import { ApiError } from '../../../lib/lib/errors';

export default class Cache extends BaseModel {
  
  collectionName = 'caches';
  schema = {
    files_id: { type: 'string' },
    expireAt: { type: 'date' },
    dateCreated: { type: 'date' },
  };
  validators = {
  };

}
