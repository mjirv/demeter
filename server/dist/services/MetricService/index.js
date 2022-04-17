import gitService from '../gitService.js';
import DbtLocalMetricService from './DbtLocalMetricService.js';
const metricService = new DbtLocalMetricService(gitService.dir || process.env.DBT_PROJECT_PATH);
export default metricService;
//# sourceMappingURL=index.js.map