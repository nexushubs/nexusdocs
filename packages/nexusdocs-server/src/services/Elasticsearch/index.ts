import * as elasticsearch from 'elasticsearch'

export default class Elasticsearch extends elasticsearch.Client {

  constructor(options) {
    const { host, port } = options;
    super({
      host: `${host}:${port}`
    })
    console.log(`# Elasticsearch connected to ${host}:${port}`);
  }

}
