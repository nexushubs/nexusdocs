import * as _ from 'lodash';
import Base from '../lib/Base';
import { IBaseData } from './types';
import { UpdateDocumentParams, GetParams, CreateDocumentParams, DeleteDocumentParams, SearchParams } from 'elasticsearch';

export interface EsContext {
  index: string,
  type: string,
}

export default class EsIndex<T extends IBaseData> extends Base {

  public context: EsContext;

  constructor(type: string) {
    super();
    this.context = {
      index: type,
      type,
    };
  }

  get raw() {
    return this.services.Elasticsearch;
  }

  prepareQuery(query: any) {
    return {
      ...this.context,
      ...query,
    }
  }

  createMany(data: T[]) {
    const body = _.flatten(data.map(fields => {
      const { _id, ...restFields } = fields;
      return [
        {
          index: {
            _index: this.context.index,
            _type: this.context.type,
            _id,
          }
        },
        restFields,
      ];
    }));
    return this.raw.bulk({ body });
  }

  create(id: string, body: T, options: Partial<CreateDocumentParams> = {}) {
    const query = this.prepareQuery({ id, body, ...options });
    return this.raw.create(query);
  }

  get(id: string, options: Partial<GetParams> = {}) {
    const query = this.prepareQuery({ id, ...options });
    return this.raw.get<T>(query);
  }

  update(id: string, body: any, options: Partial<UpdateDocumentParams> = {}) {
    const query = this.prepareQuery({ id, body, ...options });
    return this.raw.update(query);
  }

  delete(id: string, options: Partial<DeleteDocumentParams> = {}) {
    const query = this.prepareQuery({ id, ...options });
    return this.raw.delete(query);
  }

  search(body: any, options: Partial<SearchParams> = {}) {
    const query = this.prepareQuery({ body, ...options });
    return this.raw.search<T>(query);
  }

}
