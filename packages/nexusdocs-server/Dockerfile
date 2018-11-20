FROM node:carbon-alpine

WORKDIR /app

RUN apk add --update --no-cache curl python gcc g++ make libc6-compat && \
    apk add --update --no-cache vips-dev fftw-dev build-base \
      --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing/ \
      --repository http://dl-cdn.alpinelinux.org/alpine/edge/main

COPY . .

RUN yarn && \
    yarn build && \
    yarn cache clean && \
    ln -s -f /app/ndstool /usr/bin/ndstool
    # && apk del .build-deps

ENV NDS_RESTFUL_HOSTNAME 0.0.0.0
ENV NDS_RESTFUL_PORT 4000

EXPOSE 4000

CMD npm start
