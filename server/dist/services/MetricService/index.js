import gitService from '../gitService.js';
import DbtLocalMetricService from './DbtLocalMetricService.js';
import getProfileVariablesFromEnv from './utils/getProfileVariablesFromEnvironment.js';
const profileVariables = getProfileVariablesFromEnv();
const metricService = new DbtLocalMetricService({
    dbtProjectPath: gitService.dir || process.env.DBT_PROJECT_PATH || '../../..',
    target: process.env.DBT_TARGET,
    profileVariables,
});
export * from './types/index.js';
export default metricService;
//# sourceMappingURL=index.js.map