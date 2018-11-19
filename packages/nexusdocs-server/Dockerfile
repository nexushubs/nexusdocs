FROM node:carbon-alpine

WORKDIR /usr/src/app
COPY . .

ENV NDS_RESTFUL_HOSTNAME 0.0.0.0
ENV NDS_RESTFUL_PORT 4000

RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories

RUN apk update \
    apk add --no-cache \
        vips-dev \
        fftw-dev \
    && apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
    && yarn \
    && rm -rf lib/* \
    && yarn build \
    && yarn cache clean \
    && ln -s -f /usr/src/app/ndstool /usr/bin/ndstool \
    && rm -rf /var/lib/apt/lists/* \
    && apk del .gyp

EXPOSE 4000

CMD npm start
