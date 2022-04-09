# syntax=docker/dockerfile:1
FROM node:16-alpine

WORKDIR /usr/app
COPY ./ /usr/app

RUN apk add --no-cache --update python3 openssh-keygen 

RUN NODE_ENV=production npm install

ENTRYPOINT ["/usr/app/start.sh"]
EXPOSE $PORT

# TODO: Add copying down the Github project (with a URL and deploy token in the .env file?)