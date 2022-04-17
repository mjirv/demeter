import {execFileSync} from 'child_process';
import {
  DBTResource,
  MetricService,
  QueryParams,
  Selectors,
} from './types/index.js';
import fs from 'fs';
import yaml from 'js-yaml';

interface DbtMetricService extends MetricService {
  installMetricsPackage: () => void;
  listMetrics: (name?: string, selectors?: Selectors) => DBTResource[];
  queryMetric: (params: QueryParams) => Record<string, string | number>;
}

interface BigqueryKeyfileCredentials {
  type: string;
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
  authUri: string;
  tokenUri: string;
  authProviderX509CertUrl: string;
  clientX509CertUrl: string;
}

interface BigqueryRefreshTokenCredentials {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  tokenUri: string;
}

type BigqueryCredentials =
  | BigqueryKeyfileCredentials
  | BigqueryRefreshTokenCredentials;

interface StandardCredentials {
  user: string;
  password: string;
}

type DbtWarehouseCredentials = BigqueryCredentials | StandardCredentials;

interface BigqueryProfile {
  credentials: BigqueryCredentials;
}

interface PostgresProfile {
  credentials: StandardCredentials;
}

interface RedshiftProfile {
  credentials: StandardCredentials;
}

interface SnowflakeProfile {
  credentials: StandardCredentials;
}

type DbtProfile =
  | BigqueryProfile
  | PostgresProfile
  | RedshiftProfile
  | SnowflakeProfile;

interface PackageYaml {
  packages: Record<string, string>[];
}

export default class DbtLocalMetricService implements DbtMetricService {
  private dbtProjectPath: string;
  private credentials?: DbtWarehouseCredentials;
  private target?: string;
  constructor(
    dbtProjectPath?: string,
    target?: string,
    profile?: string,
    profileVariables?: DbtProfile
  ) {
    if (!dbtProjectPath) throw Error('no dbt project path given');
    this.dbtProjectPath = dbtProjectPath;
    this.target = target;
    this.credentials = profileVariables?.credentials;
  }

  installMetricsPackage = () => {
    const PACKAGE_YAML_PATH = `${this.dbtProjectPath}/packages.yml`;
    const METRICS_API_PACKAGE = {
      git: 'https://github.com/mjirv/dbt-metrics-api.git',
      revision: 'main',
    };

    console.debug('called installMetricsPackage');

    const {packages} = yaml.load(
      fs.readFileSync(PACKAGE_YAML_PATH, 'utf-8')
    ) as PackageYaml;
    console.info(packages);
    if (!packages?.find(el => el.git === METRICS_API_PACKAGE.git)) {
      console.debug('adding metrics package to packages.yml');
      packages.push(METRICS_API_PACKAGE);
      fs.writeFileSync(PACKAGE_YAML_PATH, yaml.dump({packages}));
    }

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
        {cwd: this.dbtProjectPath, encoding: 'utf-8', env: this.credentials}
      )
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
        ...(this.target ? ['--target', this.target] : []),
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
      {cwd: this.dbtProjectPath, encoding: 'utf-8', env: this.credentials}
    ).toString();
    console.debug(raw_output);
    const BREAK_STRING = '<<<MAPI-BEGIN>>>\n';
    return JSON.parse(
      raw_output.slice(raw_output.indexOf(BREAK_STRING) + BREAK_STRING.length)
    );
  };
}
