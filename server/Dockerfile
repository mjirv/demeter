# syntax=docker/dockerfile:1
FROM node:16-alpine

WORKDIR /usr/app
COPY ./ /usr/app

RUN apk add --no-cache python3

RUN NODE_ENV=production npm install
CMD ["node", "dist/index.js"]
EXPOSE $PORT