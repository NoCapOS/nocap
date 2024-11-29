"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = retry;
async function retry(fn, retries, delay) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            if (i === retries - 1)
                throw error;
            await new Promise((res) => setTimeout(res, delay));
        }
    }
}
//# sourceMappingURL=retry.js.map