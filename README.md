# dbt Metrics API

## About
Generates a REST API to query your dbt metrics using https://github.com/dbt-labs/dbt_metrics

## Usage
### Pre-Requisites
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
2. **🌄 Update environment variables** - Edit `dbt_packages/dbt_metrics_api/server/.env.local` with the path and target for your dbt project, and the port you want to run the server on
3. **✅ Run** - `cd dbt_packages/dbt_metrics_api && node dist`
### Routes
dbt-metrics-api has 3 routes:
1. GET `/metrics`
    - returns a JSON array of you metrics
    - supports "name", "type", and "model" query strings
    - ```
    michael@DESKTOP-URS6SAQ:~/metrics-api/server$ curl -X GET "http://localhost:3002/metrics?type=count"
        [{"unique_id":"metric.jaffle_shop.orders","model":"ref('orders')","name":"orders","description":"The number of orders","label":"Orders","type":"count","filters":[],"time_grains":["day","week","month","quarter","year"],"dimensions":["status","customer_id"]},{"unique_id":"metric.jaffle_shop.orders2","model":"ref('orders')","name":"orders2","description":"The number of orders","label":"Orders","type":"count","filters":[],"time_grains":["day","week","month","quarter","year"],"dimensions":["status","customer_id"]}]
    ```
2. GET `/metrics/:metric_name`
3. POST `/metrics/:metric_name`