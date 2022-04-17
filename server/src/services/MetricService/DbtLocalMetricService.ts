import {execFileSync, execSync} from 'child_process';
import {
  DBTResource,
  MetricService,
  QueryParams,
  Selectors,
} from './MetricService.js';

interface DbtMetricService extends MetricService {
  installMetricsPackage: () => void;
  listMetrics: (name?: string, selectors?: Selectors) => DBTResource[];
  queryMetric: (params: QueryParams) => Record<string, string | number>;
}

export default class DbtLocalMetricService implements DbtMetricService {
  private dbtProjectPath: string;
  constructor(dbtProjectPath?: string) {
    if (!dbtProjectPath) throw Error('no dbt project path given');
    this.dbtProjectPath = dbtProjectPath;
  }

  installMetricsPackage = () => {
    console.debug('called installMetricsPackage');
    execSync(
      'echo -e "\n  - git: https://github.com/mjirv/dbt-metrics-api.git\n    revision: main" >> packages.yml',
      {cwd: this.dbtProjectPath, shell: 'bash'}
    );
    execFileSync('dbt', ['deps'], {cwd: this.dbtProjectPath});
  };

  listMetrics = (name?: string, selectors: Selectors = {}) => {
    console.debug(
      `called listMetrics with params ${JSON.stringify({name, selectors})}`
    );
    const {type, model, package_name} = selectors;

    const select = name ? `--select "metric:${name.replace(/"/g, '')}"` : '';
    const res =
      '[' +
      execFileSync(
        'dbt',
        [
          'ls',
          '--resource-type',
          'metric',
          '--output',
          'json',
          '--output-keys',
          '"name model label description type time_grains dimensions filters unique_id package_name"',
          ...(select ? [select] : []),
        ],
        {cwd: this.dbtProjectPath}
      )
        .toString()
        .trimEnd()
        .match(/\{.*\}/i)
        ?.toString()
        .replace(/\n/g, ',') +
      ']';
    console.info(res);
    let metrics = JSON.parse(res) as DBTResource[];
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

  queryMetric = (params: QueryParams): Record<string, string | number> => {
    console.debug(`called queryMetric with params ${JSON.stringify(params)}`);
    const {
      metric_name,
      grain,
      dimensions,
      start_date,
      end_date,
      format = 'json',
    } = params;

    const raw_output = execFileSync(
      'dbt',
      [
        'run-operation',
        ...(process.env.DBT_TARGET ? ['--target', process.env.DBT_TARGET] : []),
        'dbt_metrics_api.run_metric',
        '--args',
        `${JSON.stringify({
          metric_name,
          grain,
          dimensions,
          start_date,
          end_date,
          format,
        })}`,
      ],
      {cwd: this.dbtProjectPath, encoding: 'utf-8'}
    ).toString();
    console.debug(raw_output);
    const BREAK_STRING = '<<<MAPI-BEGIN>>>\n';
    return JSON.parse(
      raw_output.slice(raw_output.indexOf(BREAK_STRING) + BREAK_STRING.length)
    );
  };
}
