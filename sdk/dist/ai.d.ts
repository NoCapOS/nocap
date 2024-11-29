/**
 * SDK for interacting with the AI API
 * @packageDocumentation
 */
import { AxiosProgressEvent } from 'axios';
import { AIClientConfig, TextGenerationOptions, StreamGenerationOptions, ImageGenerationOptions, VisualTaskOptions, ImageEditOptions, InpaintOptions, SpeakOptions, VoiceCloneOptions, VideoGenerationOptions, AudioSynthesisOptions, StableTaskOptions, WfImageGenerationOptions } from './types/ai';
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
    /**
     * Generates an image.
     * @param options - Options for image generation.
     * @returns A promise that resolves with the URL of the generated image.
     */
    generateImage(options: ImageGenerationOptions): Promise<string>;
    /**
     * Performs visual analysis tasks.
     * @param options - Options for visual tasks.
     * @returns A promise that resolves with the analysis result.
     */
    analyzeImage(options: VisualTaskOptions): Promise<any>;
    /**
     * Edits an image based on a text prompt.
     * @param options - Options for image editing.
     * @returns A promise that resolves with the URL of the edited image.
     */
    editImage(options: ImageEditOptions): Promise<string>;
    /**
     * Inpaints an image.
     * @param options - Options for image inpainting.
     * @returns A promise that resolves with the URL of the inpainted image.
     */
    inpaintImage(options: InpaintOptions): Promise<string>;
    /**
     * Generates speech from text.
     * @param options - Options for voice synthesis.
     * @returns A promise that resolves with the URL of the generated speech.
     */
    speak(options: SpeakOptions): Promise<string>;
    /**
     * Clones a voice.
     * @param options - Options for voice cloning.
     * @returns A promise that resolves with the URL of the cloned voice.
     */
    cloneVoice(options: VoiceCloneOptions): Promise<string>;
    /**
     * Uploads multiple files.
     * @param files - Array of files to upload.
     * @returns A promise that resolves with an array of URLs of the uploaded files.
     */
    uploadFiles(files: Blob[]): Promise<string[]>;
    /**
     * Bulk describes images.
     * @param images - Array of image URLs or files.
     * @returns A promise that resolves with the description results.
     */
    bulkDescribeImages(images: (string | Blob)[]): Promise<any>;
    /**
     * Generates a video from an image and prompt.
     * @param options - Options for video generation.
     * @returns A promise that resolves with the URL of the generated video.
     */
    generateVideo(options: VideoGenerationOptions): Promise<string>;
    /**
     * Checks the status of video generation.
     * @param id - The ID of the video generation task.
     * @returns A promise that resolves with the status of the video generation.
     */
    checkVideoStatus(id: string): Promise<string>;
    /**
     * Synthesizes audio from text.
     * @param options - Options for audio synthesis.
     * @returns A promise that resolves with the URL of the synthesized audio.
     */
    synthesizeAudio(options: AudioSynthesisOptions): Promise<string>;
}
