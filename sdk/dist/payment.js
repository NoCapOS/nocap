"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    getUserInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, retry_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
                const response = yield this.http.get(endpoints_1.API_ENDPOINTS.GET_USER);
                return response.data;
            }), 3, 1000);
        });
    }
    generateQRCode(amount, note) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, validation_1.validateTransactionAmount)(amount)) {
                return { success: false, error: 'Invalid transaction amount.' };
            }
            return yield (0, retry_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
                const response = yield this.http.post(endpoints_1.API_ENDPOINTS.GENERATE_QR, { amount, note });
                return response.data;
            }), 3, 1000);
        });
    }
    checkTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, retry_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
                const response = yield this.http.get(`${endpoints_1.API_ENDPOINTS.CHECK_TRANSACTION}/${transactionId}`);
                return response.data;
            }), 3, 1000);
        });
    }
}
exports.PaymentSDK = PaymentSDK;
//# sourceMappingURL=payment.js.map