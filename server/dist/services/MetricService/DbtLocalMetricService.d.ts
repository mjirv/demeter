import { DBTResource, MetricService, QueryParams, Selectors } from './types/index.js';
interface DbtMetricService extends MetricService {
    installMetricsPackage: () => void;
    listMetrics: (name?: string, selectors?: Selectors) => DBTResource[];
    queryMetric: (params: QueryParams) => Record<string, string | number>;
}
export default class DbtLocalMetricService implements DbtMetricService {
    private dbtProjectPath;
    constructor(dbtProjectPath?: string);
    installMetricsPackage: () => void;
    listMetrics: (name?: string | undefined, selectors?: Selectors) => DBTResource[];
    queryMetric: (params: QueryParams) => Record<string, string | number>;
}
export {};
