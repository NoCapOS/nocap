import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { SDKConfig } from '../types/config';

export class HttpClient {
  private client: AxiosInstance;

  constructor(config: SDKConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'access-token': config.accessToken,
        'uid': config.uid,
        'client': config.client,
        'Content-Type': 'application/json'
      }
    });
  }

  async get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }
}
