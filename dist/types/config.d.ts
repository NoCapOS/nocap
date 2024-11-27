export interface SDKConfig {
    baseUrl: string;
    accessToken: string;
    uid: string;
    client: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}
export interface RequestConfig {
    headers?: Record<string, string>;
    timeout?: number;
}
