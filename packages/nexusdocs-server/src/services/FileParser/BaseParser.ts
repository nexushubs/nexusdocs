import Base from '../../lib/Base';
import { IFileContent } from '../../types/file';

export default class BaseParser extends Base {

  public input: IFileContent;
  protected config: any;

  constructor(input: IFileContent, config: any = null) {
    super();
    this.input = input;
    this.config = config;
  }

}
