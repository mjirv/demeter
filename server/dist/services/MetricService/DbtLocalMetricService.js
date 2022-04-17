import { execFileSync } from 'child_process';
import fs from 'fs';
import yaml from 'js-yaml';
export default class DbtLocalMetricService {
    constructor(dbtProjectPath) {
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
            execFileSync('dbt', ['deps'], { cwd: this.dbtProjectPath });
        };
        this.listMetrics = (name, selectors = {}) => {
            var _a;
            console.debug(`called listMetrics with params ${JSON.stringify({ name, selectors })}`);
            const { type, model, package_name } = selectors;
            const select = name ? `--select "metric:${name.replace(/"/g, '')}"` : '';
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
                ], { cwd: this.dbtProjectPath, encoding: 'utf-8' })
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
            ], { cwd: this.dbtProjectPath, encoding: 'utf-8' }).toString();
            console.debug(raw_output);
            const BREAK_STRING = '<<<MAPI-BEGIN>>>\n';
            return JSON.parse(raw_output.slice(raw_output.indexOf(BREAK_STRING) + BREAK_STRING.length));
        };
        if (!dbtProjectPath)
            throw Error('no dbt project path given');
        this.dbtProjectPath = dbtProjectPath;
    }
}
//# sourceMappingURL=DbtLocalMetricService.js.map