export declare type Grain = 'day' | 'week' | 'month' | 'quarter' | 'year';
export interface QueryParams {
    metric_name: string;
    grain: Grain;
    dimensions?: string[];
    start_date?: string;
    end_date?: string;
    format?: 'csv' | 'json';
}
export interface DBTResource {
    name: string;
    label: string;
    description: string;
    type: string;
    time_grains: string;
    dimensions: string[];
    filters: string[];
    unique_id: string;
    model: string;
    package_name: string;
}
export interface Selectors {
    type?: string;
    model?: string;
    package_name?: string;
}
export interface MetricService {
    listMetrics: (name?: string, selectors?: Selectors) => DBTResource[];
    queryMetric: (params: QueryParams) => Record<string, string | number>;
}
