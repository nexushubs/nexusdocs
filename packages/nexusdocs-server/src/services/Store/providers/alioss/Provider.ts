import BaseProvider from '../../BaseProvider';

export default class AliOSSProvider extends BaseProvider {
 
  static optionsSchema = {
    accessKeyId: { type: 'string' },
    accessKeySecret: { type: 'string' },
    region: { type: 'string', pattern: /^[a-z]+[a-z\-\d]+$/ },
    secure: { type: 'boolean', optional: true },
  }
 
  constructor(options) {
    super(options);
  }

}
