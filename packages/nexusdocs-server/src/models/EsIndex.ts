import * as _ from 'lodash';
import Base from '../lib/Base';

export interface EsContext {
  index: string,
  type: string,
}

export default class EsIndex extends Base {

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

  prepareQuery(query) {
    return {
      ...this.context,
      ...query,
    }
  }

  createMany(data) {
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

  create(id, body, options = {}) {
    return this.raw.create(this.prepareQuery({ id, body, ...options }))
  }

  get(id, options = {}) {
    return this.raw.get(this.prepareQuery({ id, ...options }))
  }

  update(id, body, options = {}) {
    return this.raw.update(this.prepareQuery({ id, body, ...options }))
  }

  delete(id, options = {}) {
    return this.raw.delete(this.prepareQuery({ id, ...options }))
  }

  search(body, options = {}) {
    return this.raw.search(this.prepareQuery({ body, ...options }))
  }

}
