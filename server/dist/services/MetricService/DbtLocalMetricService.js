var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { execFileSync } from 'child_process';
import fs from 'fs';
import yaml from 'js-yaml';
import tempy from 'tempy';
export var Warehouse;
(function (Warehouse) {
    Warehouse["BIGQUERY"] = "bigquery";
    Warehouse["POSTGRES"] = "postgres";
    Warehouse["REDSHIFT"] = "redshift";
    Warehouse["SNOWFLAKE"] = "snowflake";
})(Warehouse || (Warehouse = {}));
export default class DbtLocalMetricService {
    constructor(props) {
        this.installMetricsPackage = () => {
            const PACKAGE_YAML_PATH = `${this.dbtProjectPath}/packages.yml`;
            const METRICS_API_PACKAGE = {
                git: 'https://github.com/mjirv/dbt-metrics-api.git',
                revision: 'main',
            };
            console.debug('called installMetricsPackage');
            const { packages } = yaml.load(fs.readFileSync(PACKAGE_YAML_PATH, 'utf-8'));
            console.info(packages);
            if (!(packages === null || packages === void 0 ? void 0 : packages.find(el => el.git === METRICS_API_PACKAGE.git))) {
                console.debug('adding metrics package to packages.yml');
                packages.push(METRICS_API_PACKAGE);
                fs.writeFileSync(PACKAGE_YAML_PATH, yaml.dump({ packages }));
            }
            try {
                execFileSync('dbt', ['deps'], { cwd: this.dbtProjectPath });
            }
            catch (error) {
                console.error(error);
                throw error;
            }
        };
        this.listMetrics = (name, selectors = {}) => {
            var _a;
            console.debug(`called listMetrics with params ${JSON.stringify({ name, selectors })}`);
            const { type, model, package_name } = selectors;
            const select = name ? `--select "metric:${name.replace(/"/g, '')}"` : '';
            console.info(this.credentials);
            const res = '[' +
                ((_a = execFileSync('dbt', [
                    'ls',
                    '--resource-type',
                    'metric',
                    '--output',
                    'json',
                    '--output-keys',
                    '"name model label description type time_grains dimensions filters unique_id package_name"',
                    ...(select ? [select] : []),
                    ...(this.profile ? ['--profile', this.profile] : []),
                    ...(this.dbtProfilePath
                        ? ['--profiles-dir', this.dbtProfilePath]
                        : []),
                ], {
                    cwd: this.dbtProjectPath,
                    encoding: 'utf-8',
                    env: Object.assign(Object.assign({}, process.env), this.credentials),
                })
                    .trimEnd()
                    .match(/\{.*\}/i)) === null || _a === void 0 ? void 0 : _a.toString().replace(/\n/g, ',')) +
                ']';
            console.info(res);
            let metrics = JSON.parse(res);
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
        this.queryMetric = (params) => {
            console.debug(`called queryMetric with params ${JSON.stringify(params)}`);
            const { metric_name, grain, dimensions, start_date, end_date, format = 'json', } = params;
            const raw_output = execFileSync('dbt', [
                'run-operation',
                ...(this.target ? ['--target', this.target] : []),
                ...(this.profile ? ['--profile', this.profile] : []),
                ...(this.dbtProfilePath ? ['--profiles-dir', this.dbtProfilePath] : []),
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
            ], {
                cwd: this.dbtProjectPath,
                encoding: 'utf-8',
                env: Object.assign(Object.assign({}, process.env), this.credentials),
            }).toString();
            console.debug(raw_output);
            const BREAK_STRING = '<<<MAPI-BEGIN>>>\n';
            return JSON.parse(raw_output.slice(raw_output.indexOf(BREAK_STRING) + BREAK_STRING.length));
        };
        const { dbtProjectPath, target, profile, profileVariables } = props;
        if (!dbtProjectPath)
            throw Error('no dbt project path given');
        this.dbtProjectPath = dbtProjectPath;
        this.target = target;
        this.credentials = profileVariables === null || profileVariables === void 0 ? void 0 : profileVariables.credentials;
        this.profile = profile;
        if (profileVariables) {
            this.profile = 'mapi_profile';
            this.target = 'prod';
            const { credentials } = profileVariables, profileWithoutSecrets = __rest(profileVariables, ["credentials"]);
            const envVar = (key) => `MAPI_DBT_PROFILE_${key.toUpperCase()}`;
            this.dbtProfilePath = tempy.directory({ prefix: '_dbt_profile' });
            console.debug(`profileVariables found; beginning to write profile.yml to directory ${this.dbtProfilePath}`);
            const credentialsToWrite = Object.fromEntries(Object.keys(credentials).map(key => [
                key,
                `{{ env_var('${envVar(key)}') }}`,
            ]));
            const profileToWrite = {
                [this.profile]: {
                    target: this.target,
                    outputs: {
                        [this.target]: Object.assign(Object.assign({}, profileWithoutSecrets), (profileVariables.type === Warehouse.BIGQUERY &&
                            credentials.method === 'service-account-json'
                            ? { keyfileJson: credentialsToWrite }
                            : credentialsToWrite)),
                    },
                },
            };
            this.credentials = Object.fromEntries(Object.entries(credentials).map(([k, v]) => [envVar(k), v]));
            fs.writeFileSync(`${this.dbtProfilePath}/profiles.yml`, yaml.dump(profileToWrite));
            console.debug('successfully wrote profile.yml');
        }
    }
}
//# sourceMappingURL=DbtLocalMetricService.js.map