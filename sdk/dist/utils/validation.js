"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccessToken = validateAccessToken;
exports.validateUid = validateUid;
exports.validateClient = validateClient;
exports.validateTransactionAmount = validateTransactionAmount;
function validateAccessToken(token) {
    return token.length > 0;
}
function validateUid(uid) {
    return uid.length > 0;
}
function validateClient(client) {
    return client.length > 0;
}
function validateTransactionAmount(amount) {
    return amount > 0;
}
//# sourceMappingURL=validation.js.map