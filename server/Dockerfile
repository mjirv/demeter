# syntax=docker/dockerfile:1
FROM node:16-alpine

WORKDIR /usr/app
COPY ./ /usr/app

RUN apk add --no-cache --update python3

RUN NODE_ENV=production npm install

CMD ["node" "dist/index.js"]
EXPOSE $PORT

# TODO: Add copying down the Github project (with a URL and deploy token in the .env file?)
# TODO: add dbt
# TODO: use connection params passed to generate a profile for dbt and run commands as that profile