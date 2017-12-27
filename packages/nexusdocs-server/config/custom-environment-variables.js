module.exports = {
  Application: {
    database: 'NDS_DATABASE',
    restful: {
      enabled: 'NDS_RESTFUL_ENABLED',
      hostname: 'NDS_RESTFUL_HOSTNAME',
      port: 'NDS_RESTFUL_PORT',
    },
  },
  services: {
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
          uniconvServerURL: 'UNOCONV_SERVER_URL',
        },
      }
    }
  },
};
