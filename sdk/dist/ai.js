"use strict";
/**
 * SDK for interacting with the AI API
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClient = void 0;
/// <reference lib="dom" />
const axios_1 = require("axios");
const response_1 = require("./types/response");
/**
 * Client for interacting with the AI API
 */
class AIClient {
    /**
     * Initializes the AIClient with configuration options.
     * @param config - Configuration options for the SDK.
     */
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.language = config.language || 'en';
    }
    /**
     * Makes an HTTP request using axios.
     * @param url - The endpoint URL.
     * @param options - Axios request configuration.
     * @returns A promise that resolves with the response data.
     * @throws ApiError if the request fails.
     */
    async request(url, options) {
        try {
            const response = await (0, axios_1.default)({
                url: `${this.baseUrl}${url}`,
                headers: {
                    'Accept-Language': this.language,
                    ...options.headers,
                },
                ...options,
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                const { status, data } = error.response;
                throw new response_1.ApiError(data.message || 'An error occurred', status, data.code);
            }
            throw new response_1.ApiError('Network error');
        }
    }
    /**
     * Generates text using a language model.
     * @param options - Options for text generation.
     * @returns A promise that resolves with the generated text.
     */
    async generateText(options) {
        const formData = new FormData();
        formData.append('prompt', options.prompt);
        formData.append('model', options.model);
        if (options.systemPrompt) {
            formData.append('system_prompt', options.systemPrompt);
        }
        if (options.imageUrl) {
            formData.append('image_url', options.imageUrl);
        }
        if (options.file) {
            formData.append('file', options.file);
        }
        return this.request('/lm', {
            method: 'POST',
            data: formData,
        });
    }
    /**
     * Generates text with a streaming response.
     * @param options - Options for streaming text generation.
     * @returns An async generator that yields chunks of generated text.
     */
    async *generateTextStream(options) {
        const response = await this.request('/lm-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(options),
            responseType: 'stream',
        });
        const reader = response.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { value, done } = await reader.read();
            if (done)
                break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    yield line.slice(6);
                }
            }
        }
    }
    /**
     * Uploads a single file.
     * @param name - The name of the file.
     * @param file - The file to upload.
     * @param contentType - Optional content type of the file.
     * @param onUploadProgress - Optional callback for tracking upload progress.
     * @returns A promise that resolves with the URL of the uploaded file.
     */
    async uploadFile(name, file, contentType, onUploadProgress) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request(`/file/${name}`, {
            method: 'PUT',
            headers: {
                ...(contentType && { 'Content-Type': contentType }),
            },
            data: formData,
            onUploadProgress,
        });
    }
    /**
     * Performs Stable Diffusion tasks.
     * @param options - Options for the Stable Diffusion task.
     * @returns A promise that resolves with the result of the task.
     */
    async runStableTask(options) {
        const formData = options.imageData;
        formData.append('task', options.task);
        if (options.prompt) {
            formData.append('prompt', options.prompt);
        }
        return this.request('/image-stable', {
            method: 'POST',
            data: formData,
        });
    }
    /**
     * Generates an image using the workflow endpoint.
     * @param options - Options for workflow image generation.
     * @returns A promise that resolves with the URL of the generated image.
     */
    async generateWorkflowImage(options) {
        return this.request('/wf/image-imagine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                model: options.model,
                prompt: options.prompt,
                aspect_ratio: options.aspectRatio,
                seed: options.seed
            })
        });
    }
}
exports.AIClient = AIClient;
//# sourceMappingURL=ai.js.map