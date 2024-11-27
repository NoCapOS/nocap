import { EventEmitter } from 'eventemitter3';
import { SDKConfig } from './types/config';
import { ApiResponse, ErrorResponse, UserInfo, QRCodeResponse, TransactionResponse } from './types/response';
declare class PaymentSDK extends EventEmitter {
    private http;
    constructor(config: SDKConfig);
    getUserInfo(): Promise<ApiResponse<UserInfo> | ErrorResponse>;
    generateQRCode(amount: number, note: string): Promise<ApiResponse<QRCodeResponse> | ErrorResponse>;
    checkTransaction(transactionId: string): Promise<ApiResponse<TransactionResponse> | ErrorResponse>;
}
export { PaymentSDK };
