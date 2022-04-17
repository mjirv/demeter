import gitService from '../gitService.js';
import DbtLocalMetricService from './DbtLocalMetricService.js';
const metricService = new DbtLocalMetricService(
  gitService.dir || process.env.DBT_PROJECT_PATH,
  process.env.DBT_TARGET
);

export * from './types/index.js';
export default metricService;
