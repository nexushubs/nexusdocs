FROM node:carbon-alpine

WORKDIR /usr/src/app
COPY . .

ENV NDS_RESTFUL_HOSTNAME 0.0.0.0
ENV NDS_RESTFUL_PORT 4000

RUN apk add --no-cache --repository https://dl-3.alpinelinux.org/alpine/edge/testing/ \
        vips-dev \
        fftw-dev \
    && apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
    && npm install \
    && rm -rf lib/* \
    && npm run build \
    && npm cache clean --force \
    && ln -s -f /usr/src/app/ndstool /usr/bin/ndstool \
    && apk del .gyp

EXPOSE 4000

CMD npm start
