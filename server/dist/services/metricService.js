import { execSync } from 'child_process';
import gitService from './gitService.js';
const DBT_PROJECT_PATH = gitService.dir || process.env.DBT_PROJECT_PATH;
console.info(DBT_PROJECT_PATH);
export const listMetrics = (name, selectors = {}) => {
    console.debug(`called listMetrics with params ${JSON.stringify({ name, selectors })}`);
    const { type, model, package_name } = selectors;
    // TODO: added some basic replacement to prevent bash injection, but I should clean this up here and elsewhere
    const select = name ? `--select "metric:${name.replace(/"/g, '')}"` : '';
    let metrics = JSON.parse('[' +
        execSync(`cd ${DBT_PROJECT_PATH} &&\
          dbt ls --resource-type metric --output json \
          --output-keys "name model label description type time_grains dimensions filters unique_id package_name" \
          ${select}`, { encoding: 'utf-8', shell: '/bin/bash' })
            .trimEnd()
            .replace(/\n/g, ',') +
        ']');
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
export const queryMetric = (params) => {
    console.debug(`called queryMetric with params ${JSON.stringify(params)}`);
    const { metric_name, grain, dimensions, start_date, end_date, format = 'json', } = params;
    const raw_output = execSync(`cd ${DBT_PROJECT_PATH} &&\
          dbt run-operation --target ${process.env.DBT_TARGET} dbt_metrics_api.run_metric --args '${JSON.stringify({
        metric_name,
        grain,
        dimensions,
        start_date,
        end_date,
        format,
    })}'
      `, { encoding: 'utf-8' });
    console.debug(raw_output);
    const BREAK_STRING = '<<<MAPI-BEGIN>>>\n';
    return raw_output.slice(raw_output.indexOf(BREAK_STRING) + BREAK_STRING.length);
};
//# sourceMappingURL=metricService.js.map