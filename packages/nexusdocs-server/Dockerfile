FROM node:carbon-alpine as builder

WORKDIR /app

RUN apk add --no-cache python make g++ vips-dev fftw-dev
COPY package.json yarn.lock /app/
RUN yarn
COPY . .
RUN yarn build

FROM node:carbon-alpine

WORKDIR /app

RUN apk add --no-cache bash curl vips-dev fftw-dev
COPY --from=builder /app /app
RUN ln -s -f /app/ndstool /usr/bin/ndstool

ENV NDS_RESTFUL_HOSTNAME=0.0.0.0 \
    NDS_RESTFUL_PORT=4000

ARG GIT_HASH
ARG GIT_REF
ARG PACKAGE_VERSION
ARG VERSION
ARG BUILD_TIME
ARG BUILD_TRIGGER

ENV GIT_HASH=$GIT_HASH \
    GIT_REF=$GIT_REF \
    PACKAGE_VERSION=$PACKAGE_VERSION \
    VERSION=$VERSION \
    BUILD_TIME=$BUILD_TIME \
    BUILD_TRIGGER=$BUILD_TRIGGER

EXPOSE 4000

CMD yarn start
