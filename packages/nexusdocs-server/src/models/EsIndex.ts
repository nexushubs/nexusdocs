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
    return this.raw.create(this.prepareQuery({ id, body, ...options }))
  }

  get(id: string, options: Partial<GetParams> = {}) {
    return this.raw.get<T>(this.prepareQuery({ id, ...options }))
  }

  update(id: string, body: any, options: Partial<UpdateDocumentParams> = {}) {
    return this.raw.update(this.prepareQuery({ id, body, ...options }))
  }

  delete(id: string, options: Partial<DeleteDocumentParams> = {}) {
    return this.raw.delete(this.prepareQuery({ id, ...options }))
  }

  search(body: any, options: Partial<SearchParams> = {}) {
    return this.raw.search<T>(this.prepareQuery({ body, ...options }))
  }

}
