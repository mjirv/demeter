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
#### GET `/metrics`
- returns a JSON array of your project's metrics
- supports "name", "type", "model", and "package_name" query strings for filtering
- ```json
    $ curl -X GET "http://localhost:3002/metrics?type=count&package_name=jaffle_shop"
    [{"unique_id":"metric.jaffle_shop.orders","package_name":"jaffle_shop","model":"ref('orders')","name":"orders","description":"The number of orders","label":"Orders","type":"count","filters":[],"time_grains":["day","week","month","quarter","year"],"dimensions":["status","customer_id"]},{"unique_id":"metric.jaffle_shop.orders2","package_name":"jaffle_shop","model":"ref('orders')","name":"orders2","description":"The number of orders","label":"Orders","type":"count","filters":[],"time_grains":["day","week","month","quarter","year"],"dimensions":["status","customer_id"]}]
    ```
#### GET `/metrics/:metric_name`
- returns a JSON object with keys `unique_id, package_name, model, name, description, label, type, filters, time_grains, dimensions`
- ```json
    $ curl -X GET "http://localhost:3002/metrics/orders"
    {"unique_id":"metric.jaffle_shop.orders","package_name":"jaffle_shop","model":"ref('orders')","name":"orders","description":"The number of orders","label":"Orders","type":"count","filters":[],"time_grains":["day","week","month","quarter","year"],"dimensions":["status","customer_id"]}
    ```
#### POST `/metrics/:metric_name`
- Queries a metric and returns the result
- Accepts a JSON object in the request body with the following properties: `grain, dimensions, start_date, end_date` (`start_date` and `end_date` are optional)
- Returns a JSON object or CSV depending on your `Accept:` header (`application/json` or `text/csv`)
- ```json
    $ curl http://localhost:3002/metrics/orders -H "Content-Type: application/json" -H "Accept: application/json" -d '{"grain": "year", "start_date": "2017-01-01", "end_date": "2019-01-01"}'
    [{"period": "2017-01-01", "orders": 0.0}, {"period": "2018-01-01", "orders": 99.0}, {"period": "2019-01-01", "orders": 0.0}]
    ```