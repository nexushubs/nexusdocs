var source = mongodb({
  "uri": "${MONGODB_URI}" || "mongodb://127.0.0.1/nexusdocs"
  // "timeout": "30s",
  // "tail": false,
  // "ssl": false,
  // "cacerts": ["/path/to/cert.pem"],
  // "wc": 1,
  // "fsync": false,
  // "bulk": false,
  // "collection_filters": "{}",
  // "read_preference": "Primary"
})

var sink = elasticsearch({
  "uri": "${ELASTICSEARCH_HOST}" ? ("http://${ELASTICSEARCH_HOST}/docs.files.store") : "http://127.0.0.1:9200/docs.files.store"
  // "timeout": "10s", // defaults to 30s
  // "aws_access_key": "ABCDEF", // used for signing requests to AWS Elasticsearch service
  // "aws_access_secret": "ABCDEF" // used for signing requests to AWS Elasticsearch service
  // "parent_id": "elastic_parent" // defaults to "elastic_parent" parent identifier for Elasticsearch
})

t.Source("source", source, "/^docs\.files\.store$/").Save("sink", sink, "/^docs\.files\.store$/")
