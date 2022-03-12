# dbt Metrics API

## About
Generates a REST API to query your dbt metrics using https://github.com/dbt-labs/dbt_metrics

## Quickstart
1. **📦 Install dbt-metrics-api**
    - Add the following to your dbt project's `packages.yml` file:
    ```yaml
        - git: "https://github.com/mjirv/dbt-metrics-api.git"
          revision: main
    ```
    - Run `dbt deps`
2. **🔨 Install Node** - Start by making sure node is installed.
    - Run `node --version`
    - If there is no output or node is not found, follow the steps at https://heynode.com/tutorial/install-nodejs-locally-nvm/ to install Node.
3. **🌄 Update environment variables** - Edit `dbt_packages/dbt_metrics_api/server/.env.local` with the path and target for your dbt project, and the port you want to run the server on
4. **✅ Run** - `cd dbt_packages/dbt_metrics_api && node dist`