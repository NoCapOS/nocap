"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSDK = void 0;
const eventemitter3_1 = require("eventemitter3");
const http_1 = require("./utils/http");
const endpoints_1 = require("./constants/endpoints");
const retry_1 = require("./utils/retry");
const validation_1 = require("./utils/validation");
class PaymentSDK extends eventemitter3_1.EventEmitter {
    constructor(config) {
        super();
        this.http = new http_1.HttpClient(config);
    }
    async getUserInfo() {
        return await (0, retry_1.retry)(async () => {
            const response = await this.http.get(endpoints_1.API_ENDPOINTS.GET_USER);
            return response.data;
        }, 3, 1000);
    }
    async generateQRCode(amount, note) {
        if (!(0, validation_1.validateTransactionAmount)(amount)) {
            return { success: false, error: 'Invalid transaction amount.' };
        }
        return await (0, retry_1.retry)(async () => {
            const response = await this.http.post(endpoints_1.API_ENDPOINTS.GENERATE_QR, { amount, note });
            return response.data;
        }, 3, 1000);
    }
    async checkTransaction(transactionId) {
        return await (0, retry_1.retry)(async () => {
            const response = await this.http.get(`${endpoints_1.API_ENDPOINTS.CHECK_TRANSACTION}/${transactionId}`);
            return response.data;
        }, 3, 1000);
    }
}
exports.PaymentSDK = PaymentSDK;
//# sourceMappingURL=payment.js.map