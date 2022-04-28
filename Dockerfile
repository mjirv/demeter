# syntax=docker/dockerfile:1
FROM node:18

WORKDIR /usr/app
COPY ./server/ /usr/app

RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip
RUN python3 -m pip install dbt-core dbt-snowflake dbt-redshift dbt-bigquery dbt-postgres

RUN NODE_ENV=production npm install

CMD ["node", "dist/index.js"]
EXPOSE $PORT