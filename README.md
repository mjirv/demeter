# Demeter

## The dbt Metrics API

Demeter turns your dbt project into a metrics platform. You get a REST/GraphQL API so you can query, build interactive apps, and use your metrics from anywhere.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

- [Demeter](#demeter)
  - [The dbt Metrics API](#the-dbt-metrics-api)
  - [About](#about)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Quickstart](#quickstart)
  - [Usage](#usage)
    - [Routes](#routes)
      - [GET `/metrics`](#get-metrics)
      - [GET `/metrics/:metric_name`](#get-metricsmetric_name)
      - [POST `/metrics/:metric_name`](#post-metricsmetric_name)
      - [POST `/graphql`](#post-graphql)
    - [Authentication](#authentication)

## About

Generates a REST API (including a GraphQL endpoint) to query your dbt metrics using https://github.com/dbt-labs/dbt_metrics

![graphql](https://user-images.githubusercontent.com/5953854/158102577-f935b647-88f4-4180-b161-81f86a454ccb.PNG)

## Installation

### Prerequisites

1. A [dbt project](https://docs.getdbt.com/tutorial/setting-up)
2. Node
   - Run `node --version`
   - If there is no output or node is not found, follow the steps at https://heynode.com/tutorial/install-nodejs-locally-nvm/ to install Node.

### Quickstart

1. **📦 Install dbt-metrics-api**
   - Add the following to your dbt project's `packages.yml` file:
   ```yaml
   - git: "https://github.com/mjirv/dbt-metrics-api.git"
     revision: main
   ```
   - Run `dbt deps`
2. **🌄 Update environment variables** - Copy `server/.example.env` to `server/.env` and (if needed) update the environment variables with your connection details and dbt profile
3. **✅ Run** - `cd dbt_packages/dbt_metrics_api/server && node dist/`

## Usage

### Routes

dbt-metrics-api has 4 routes:

#### GET `/metrics`

- returns a JSON array of your project's metrics
- supports "name", "type", "model", and "package_name" query strings for filtering

      $ curl -X GET "http://localhost:3002/metrics?type=count&package_name=jaffle_shop"

      [{"unique_id":"metric.jaffle_shop.orders","package_name":"jaffle_shop","model":"ref('orders')","name":"orders","description":"The number of orders","label":"Orders","type":"count","filters":[],"time_grains":["day","week","month","quarter","year"],"dimensions":["status","customer_id"]},{"unique_id":"metric.jaffle_shop.orders2","package_name":"jaffle_shop","model":"ref('orders')","name":"orders2","description":"The number of orders","label":"Orders","type":"count","filters":[],"time_grains":["day","week","month","quarter","year"],"dimensions":["status","customer_id"]}]

#### GET `/metrics/:metric_name`

- returns a JSON object with keys `unique_id, package_name, model, name, description, label, type, filters, time_grains, dimensions`

      $ curl -X GET "http://localhost:3002/metrics/orders"

      {"unique_id":"metric.jaffle_shop.orders","package_name":"jaffle_shop","model":"ref('orders')","name":"orders","description":"The number of orders","label":"Orders","type":"count","filters":[],"time_grains":["day","week","month","quarter","year"],"dimensions":["status","customer_id"]}

#### POST `/metrics/:metric_name`

- Queries a metric and returns the result
- Accepts a JSON object in the request body with the following properties: `grain, dimensions, start_date, end_date` (`start_date` and `end_date` are optional)
- Returns a JSON object or CSV depending on your `Accept:` header (`application/json` or `text/csv`)

      $ curl http://localhost:3002/metrics/orders -H "Content-Type: application/json" -H "Accept: application/json" -d '{"grain": "year", "start_date": "2017-01-01", "end_date": "2019-01-01"}'

      [{"period": "2017-01-01", "orders": 0.0}, {"period": "2018-01-01", "orders": 99.0}, {"period": "2019-01-01", "orders": 0.0}]

#### POST `/graphql`

- GraphQL API for your metrics
- Visit `YOUR_SERVER_PATH/graphql` (e.g. http://localhost:3002/graphql) to see the GraphiQL client and schema

### Authentication

dbt-metrics-api supports [Kable](https://kable.io) for authentication.

To get started:

1. Sign up at https://kable.io (the free tier includes unlimited test requests and up to 10,000 live requests)
2. Note your client ID and secret and add them to your `server/.env.local` file:

   ```bash
   KABLE_CLIENT_ID=
   KABLE_CLIENT_SECRET=

   # you will need to set to LIVE in production
   KABLE_ENV=TEST
   ```

3. Requests will now require authentication with a customer ID and secret that you set up in your Kable dashboard using `X-CLIENT-ID` and `X-API-KEY` headers

   ```json
   $ curl -X GET "http://localhost:3002/metrics/orders" -H "X-CLIENT-ID: test-customer-1" -H "X-API-KEY: sk_test.some.secret.key"
   ```
