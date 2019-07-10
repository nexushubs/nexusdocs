module.exports = {
  Application: {
    database: 'NDS_DATABASE',
    restful: {
      enabled: 'NDS_RESTFUL_ENABLED',
      hostname: 'NDS_RESTFUL_HOSTNAME',
      port: 'NDS_RESTFUL_PORT',
      trustedProxy: 'NDS_RESTFUL_TRUSTED_PROXY',
      serverUrl: 'NDS_RESTFUL_SERVER_URL',
    },
    debug: {
      request: 'NDS_DEBUG_REQUEST',
    }
  },
  services: {
    Elasticsearch: {
      host: 'ELASTICSEARCH_HOST',
      port: 'ELASTICSEARCH_PORT',
    },
    FileCache: {
      clearOnStartup: 'FILE_CACHE_CLEAR_ON_STARTUP',
    },
    FileParser: {
      parsers: {
        ImageThumbParser: {
          thumbSize: 'IMAGE_THUMB_SIZE',
        },
      },
    },
    FileConverter: {
      converters: {
        DocumentConverter: {
          unoconvServerURL: 'UNOCONV_SERVER_URL',
        },
        Pdf2ImageConverter: {
          url: 'PDF2IMAGE_URL',
          mqtt: 'PDF2IMAGE_MQTT',
        },
      }
    }
  },
};
