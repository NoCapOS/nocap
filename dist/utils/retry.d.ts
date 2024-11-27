export declare function retry<T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T | undefined>;
