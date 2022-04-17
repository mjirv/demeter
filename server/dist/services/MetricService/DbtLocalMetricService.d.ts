import { DBTResource, MetricService, QueryParams, Selectors } from './types/index.js';
interface DbtMetricService extends MetricService {
    installMetricsPackage: () => void;
    listMetrics: (name?: string, selectors?: Selectors) => DBTResource[];
    queryMetric: (params: QueryParams) => Record<string, string | number>;
}
declare type Credentials = Record<string, string>;
interface BigqueryProfile {
    credentials: Credentials;
}
interface PostgresProfile {
    credentials: Credentials;
}
interface RedshiftProfile {
    credentials: Credentials;
}
interface SnowflakeProfile {
    credentials: Credentials;
}
declare type DbtProfile = BigqueryProfile | PostgresProfile | RedshiftProfile | SnowflakeProfile;
export default class DbtLocalMetricService implements DbtMetricService {
    private dbtProjectPath;
    private credentials?;
    private target?;
    constructor(dbtProjectPath?: string, target?: string, profile?: string, profileVariables?: DbtProfile);
    installMetricsPackage: () => void;
    listMetrics: (name?: string | undefined, selectors?: Selectors) => DBTResource[];
    queryMetric: (params: QueryParams) => Record<string, string | number>;
}
export {};
