
import Base from '../../lib/Base';
import { IProviderOptions, IProvider, IBucket } from './types';

export default abstract class BaseProvider extends Base {

  public options: IProviderOptions;
  public name: string;
  public buckets: {[key: string]: IBucket};

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
      const bucket = new Bucket(this as any as IProvider, bucketName);
      this.buckets[bucketName] = bucket;
    }
    return this.buckets[bucketName];
  }

  async destroy() {
    
  }
  
}
