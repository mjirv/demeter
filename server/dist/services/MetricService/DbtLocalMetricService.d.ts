import { DBTResource, MetricService, QueryParams, Selectors } from './types/index.js';
interface DbtMetricService extends MetricService {
    installMetricsPackage: () => void;
    listMetrics: (name?: string, selectors?: Selectors) => DBTResource[];
    queryMetric: (params: QueryParams) => Record<string, string | number>;
}
export declare enum Warehouse {
    BIGQUERY = "bigquery",
    POSTGRES = "postgres",
    REDSHIFT = "redshift",
    SNOWFLAKE = "snowflake"
}
declare type Credentials = Record<string, string>;
interface BigqueryProfile {
    type: Warehouse.BIGQUERY;
    credentials: Credentials;
}
interface PostgresProfile {
    type: Warehouse.POSTGRES;
    credentials: Credentials;
}
interface RedshiftProfile {
    type: Warehouse.REDSHIFT;
    credentials: Credentials;
}
interface SnowflakeProfile {
    type: Warehouse.SNOWFLAKE;
    credentials: Credentials;
}
export declare type DbtProfile = BigqueryProfile | PostgresProfile | RedshiftProfile | SnowflakeProfile;
export default class DbtLocalMetricService implements DbtMetricService {
    private dbtProjectPath;
    private dbtProfilePath?;
    private profile?;
    private credentials?;
    private target?;
    constructor(props: {
        dbtProjectPath?: string;
        target?: string;
        profile?: string;
        profileVariables?: DbtProfile;
    });
    installMetricsPackage: () => void;
    listMetrics: (name?: string | undefined, selectors?: Selectors) => DBTResource[];
    queryMetric: (params: QueryParams) => Record<string, string | number>;
}
export {};
