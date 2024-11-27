import { AxiosRequestConfig } from 'axios';
import { SDKConfig } from '../types/config';
export declare class HttpClient {
    private client;
    constructor(config: SDKConfig);
    get(url: string, config?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<any, any>>;
    post(url: string, data?: any, config?: AxiosRequestConfig): Promise<import("axios").AxiosResponse<any, any>>;
}
