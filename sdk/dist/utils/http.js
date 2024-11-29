"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const axios_1 = require("axios");
class HttpClient {
    constructor(config) {
        this.client = axios_1.default.create({
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
    async get(url, config) {
        return this.client.get(url, config);
    }
    async post(url, data, config) {
        return this.client.post(url, data, config);
    }
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=http.js.map