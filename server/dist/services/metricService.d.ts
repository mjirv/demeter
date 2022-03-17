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
interface Selectors {
    type?: string;
    model?: string;
    package_name?: string;
}
export declare const listMetrics: (name?: string | undefined, selectors?: Selectors) => DBTResource[];
export declare type Grain = 'day' | 'week' | 'month' | 'quarter' | 'year';
interface QueryParams {
    metric_name: string;
    grain: Grain;
    dimensions?: string[];
    start_date?: string;
    end_date?: string;
    format?: 'csv' | 'json';
}
export declare const queryMetric: (params: QueryParams) => string;
export {};
