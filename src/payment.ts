import { EventEmitter } from 'eventemitter3';
import { HttpClient } from './utils/http';
import { API_ENDPOINTS } from './constants/endpoints';
import { SDKConfig } from './types/config';
import { ApiResponse, ErrorResponse, UserInfo, QRCodeResponse, TransactionResponse } from './types/response';
import { retry } from './utils/retry';
import { validateTransactionAmount } from './utils/validation';

class PaymentSDK extends EventEmitter {
  private http: HttpClient;

  constructor(config: SDKConfig) {
    super();
    this.http = new HttpClient(config);
  }

  async getUserInfo(): Promise<ApiResponse<UserInfo> | ErrorResponse> {
    return await retry(async () => {
      const response = await this.http.get(API_ENDPOINTS.GET_USER);
      return response.data;
    }, 3, 1000);
  }

  async generateQRCode(amount: number, note: string): Promise<ApiResponse<QRCodeResponse> | ErrorResponse> {
    if (!validateTransactionAmount(amount)) {
      return { success: false, error: 'Invalid transaction amount.' };
    }

    return await retry(async () => {
      const response = await this.http.post(API_ENDPOINTS.GENERATE_QR, { amount, note });
      return response.data;
    }, 3, 1000);
  }

  async checkTransaction(transactionId: string): Promise<ApiResponse<TransactionResponse> | ErrorResponse> {
    return await retry(async () => {
      const response = await this.http.get(`${API_ENDPOINTS.CHECK_TRANSACTION}/${transactionId}`);
      return response.data;
    }, 3, 1000);
  }
}

export { PaymentSDK };
