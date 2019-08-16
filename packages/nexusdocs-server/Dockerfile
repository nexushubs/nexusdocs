FROM node:carbon-alpine

WORKDIR /app

RUN apk add --update --no-cache curl python ca-certificates
RUN apk add vips-dev fftw-dev build-base --update-cache \
      --repository http://dl-cdn.alpinelinux.org/alpine/edge/community/ \
      --repository http://dl-cdn.alpinelinux.org/alpine/edge/main/
      # --repository https://alpine.global.ssl.fastly.net/alpine/edge/community/ \
      # --repository https://alpine.global.ssl.fastly.net/alpine/edge/main

COPY . .
RUN yarn && \
    yarn build && \
    yarn --production && \
    yarn cache clean

## Cached yarn for development
# COPY package.json yarn.lock ./
# RUN yarn
# COPY . .
# RUN yarn build

RUN ln -s -f /app/ndstool /usr/bin/ndstool

ENV NDS_RESTFUL_HOSTNAME 0.0.0.0
ENV NDS_RESTFUL_PORT 4000

EXPOSE 4000

CMD npm start
