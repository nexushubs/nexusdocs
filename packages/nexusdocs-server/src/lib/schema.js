import { ObjectId } from 'mongodb';

import { app } from '~/init/application';

export function providerType(schema, candidate) {
  const { Store } = app().service();
  if (candidate && schema.$providerType && !Store.hasType(candidate)) {
    this.report('provider type invalid or not supported');
  }
};

export function bucketName(schema, candidate) {
  if (candidate && schema.$bucketName) {
    // followed by amazon bucket naming policy
    // http://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
    if (!/^[a-z0-9][a-z0-9\-]+[a-z0-9]$/.test(candidate) || candidate.includes('..')) {
      this.report('invalid bucket name');
    }
  }
};

export function isObjectId(schema, candidate) {
  if (candidate && schema.$isObjectId) {
    // followed by amazon bucket naming policy
    // http://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
    if (!(/^[a-f0-9]{24}$/.test(candidate) || !ObjectId.isValid(candidate))) {
      this.report('invalid ObjectId');
    }
  }
};
