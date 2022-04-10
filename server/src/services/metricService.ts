import {execSync} from 'child_process';

export interface DBTResource {
  name: string;
  label: string;
  description: string;
  type: string;
  time_grains: string;
  dimensions: string[];
  filters: string[];
  unique_id: string;
  model: string;
  package_name: string;
}

interface Selectors {
  type?: string;
  model?: string;
  package_name?: string;
}

export const listMetrics = (name?: string, selectors: Selectors = {}) => {
  console.debug(
    `called listMetrics with params ${JSON.stringify({name, selectors})}`
  );
  const {type, model, package_name} = selectors;

  // TODO: added some basic replacement to prevent bash injection, but I should clean this up here and elsewhere
  const select = name ? `--select "metric:${name.replace(/"/g, '')}"` : '';
  let metrics = JSON.parse(
    '[' +
      execSync(
        `cd ${process.env.DBT_PROJECT_PATH} &&\
          dbt ls --resource-type metric --output json \
          --output-keys "name model label description type time_grains dimensions filters unique_id package_name" \
          ${select}`,
        {encoding: 'utf-8', shell: '/bin/bash'}
      )
        .trimEnd()
        .replace(/\n/g, ',') +
      ']'
  ) as DBTResource[];
  if (type) {
    metrics = metrics.filter(metric => metric.type === type);
  }
  if (model) {
    metrics = metrics.filter(metric => metric.model === model);
  }
  if (package_name) {
    metrics = metrics.filter(metric => metric.package_name === package_name);
  }
  return metrics;
};

export type Grain = 'day' | 'week' | 'month' | 'quarter' | 'year';
interface QueryParams {
  metric_name: string;
  grain: Grain;
  dimensions?: string[];
  start_date?: string;
  end_date?: string;
  format?: 'csv' | 'json';
}

export const queryMetric = (params: QueryParams): string => {
  console.debug(`called queryMetric with params ${JSON.stringify(params)}`);
  const {
    metric_name,
    grain,
    dimensions,
    start_date,
    end_date,
    format = 'json',
  } = params;

  const raw_output = execSync(
    `cd ${process.env.DBT_PROJECT_PATH} &&\
          dbt run-operation --target ${
            process.env.DBT_TARGET
          } dbt_metrics_api.run_metric --args '${JSON.stringify({
      metric_name,
      grain,
      dimensions,
      start_date,
      end_date,
      format,
    })}'
      `,
    {encoding: 'utf-8'}
  );
  console.debug(raw_output);
  const BREAK_STRING = '<<<MAPI-BEGIN>>>\n';
  return raw_output.slice(
    raw_output.indexOf(BREAK_STRING) + BREAK_STRING.length
  );
};
