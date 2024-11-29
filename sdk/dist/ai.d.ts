/**
 * SDK for interacting with the AI API
 * @packageDocumentation
 */
import { AxiosProgressEvent } from 'axios';
import { AIClientConfig, TextGenerationOptions, StreamGenerationOptions, StableTaskOptions, WfImageGenerationOptions } from './types/ai';
/**
 * Client for interacting with the AI API
 */
export declare class AIClient {
    private baseUrl;
    private language;
    /**
     * Initializes the AIClient with configuration options.
     * @param config - Configuration options for the SDK.
     */
    constructor(config: AIClientConfig);
    /**
     * Makes an HTTP request using axios.
     * @param url - The endpoint URL.
     * @param options - Axios request configuration.
     * @returns A promise that resolves with the response data.
     * @throws ApiError if the request fails.
     */
    private request;
    /**
     * Generates text using a language model.
     * @param options - Options for text generation.
     * @returns A promise that resolves with the generated text.
     */
    generateText(options: TextGenerationOptions): Promise<string>;
    /**
     * Generates text with a streaming response.
     * @param options - Options for streaming text generation.
     * @returns An async generator that yields chunks of generated text.
     */
    generateTextStream(options: StreamGenerationOptions): AsyncGenerator<string>;
    /**
     * Uploads a single file.
     * @param name - The name of the file.
     * @param file - The file to upload.
     * @param contentType - Optional content type of the file.
     * @param onUploadProgress - Optional callback for tracking upload progress.
     * @returns A promise that resolves with the URL of the uploaded file.
     */
    uploadFile(name: string, file: Blob, contentType?: string, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void): Promise<string>;
    /**
     * Performs Stable Diffusion tasks.
     * @param options - Options for the Stable Diffusion task.
     * @returns A promise that resolves with the result of the task.
     */
    runStableTask(options: StableTaskOptions): Promise<string>;
    /**
     * Generates an image using the workflow endpoint.
     * @param options - Options for workflow image generation.
     * @returns A promise that resolves with the URL of the generated image.
     */
    generateWorkflowImage(options: WfImageGenerationOptions): Promise<string>;
}
