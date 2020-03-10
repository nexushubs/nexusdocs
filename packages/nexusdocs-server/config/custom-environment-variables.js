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
      enabled: 'ELASTICSEARCH_ENABLED',
      host: 'ELASTICSEARCH_HOST',
      port: 'ELASTICSEARCH_PORT',
    },
    FileCache: {
      enabled: 'FILE_CACHE_ENABLED',
      clearOnStartup: 'FILE_CACHE_CLEAR_ON_STARTUP',
    },
    FileParser: {
      enabled: 'FILE_PARSER_ENABLED',
      parsers: {
        ImageThumbParser: {
          thumbSize: 'IMAGE_THUMB_SIZE',
        },
      },
    },
    FileConverter: {
      enabled: 'FILE_CONVERTER_ENABLED',
      converters: {
        UnoconvConverter: {
          unoconvServerUrl: 'UNOCONV_SERVER_URL',
        },
        PandocConverter: {
          pandocApiUrl: 'PANDOC_API_URL',
        },
        Pdf2ImageConverter: {
          url: 'PDF2IMAGE_URL',
          mqtt: 'PDF2IMAGE_MQTT',
        },
      }
    }
  },
};
