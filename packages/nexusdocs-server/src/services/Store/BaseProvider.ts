
import Base from 'lib/Base';
import { IBaseProvider, IProviderOptions, IStoreBucket } from './types';

export default class BaseProvider extends Base implements IBaseProvider {

  public options: IProviderOptions;
  public name: string;
  public buckets: {[key: string]: IStoreBucket};

  constructor(options: IProviderOptions) {
    super();
    this.validOptions(options);
    this.options = options;
    this.name = options.name;
    this.buckets = {};
  }

  validOptions(options: any) {
  }

  async bucket(bucketName: string) {
    if (!this.buckets[bucketName]) {
      const { buckets } = this.options;
      if (!buckets.includes(bucketName)) {
        throw new Error('invalid bucket name');
      }
      const { Bucket } = this.options;
      const bucket = new Bucket(this, bucketName);
      this.buckets[bucketName] = bucket;
    }
    return this.buckets[bucketName];
  }

  async destroy() {
    
  }
  
}
