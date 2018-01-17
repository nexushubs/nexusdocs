FROM node:carbon

WORKDIR /usr/src/app
COPY . .

ENV NDS_RESTFUL_HOSTNAME 0.0.0.0
ENV NDS_RESTFUL_PORT 4000

RUN npm install \
    && rm -rf lib/* \
    && npm run build \
    && ln -s -f /usr/src/app/ndstool /usr/bin/ndstool

CMD npm start
