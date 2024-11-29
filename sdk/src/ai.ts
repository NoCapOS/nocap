/**
 * SDK for interacting with the AI API
 * @packageDocumentation
 */

import axios, { AxiosRequestConfig, AxiosProgressEvent } from 'axios';
import {
  AIClientConfig,
  TextGenerationOptions,
  StreamGenerationOptions,
  ImageGenerationOptions,
  VisualTaskOptions,
  ImageEditOptions,
  InpaintOptions,
  SpeakOptions,
  VoiceCloneOptions,
  VideoGenerationOptions,
  AudioSynthesisOptions,
  StableTaskOptions,
  WfImageGenerationOptions
} from './types/ai';
import { ApiError } from './types/response';

/**
 * Client for interacting with the AI API
 */
export class AIClient {
  private baseUrl: string;
  private language: string;

  /**
   * Initializes the AIClient with configuration options.
   * @param config - Configuration options for the SDK.
   */
  constructor(config: AIClientConfig) {
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
  private async request<T>(url: string, options: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios({
        url: `${this.baseUrl}${url}`,
        headers: {
          'Accept-Language': this.language,
          ...options.headers,
        },
        ...options,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const { status, data } = error.response;
        throw new ApiError(data.message || 'An error occurred', status, data.code);
      }
      throw new ApiError('Network error');
    }
  }

  /**
   * Generates text using a language model.
   * @param options - Options for text generation.
   * @returns A promise that resolves with the generated text.
   */
  async generateText(options: TextGenerationOptions): Promise<string> {
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

    return this.request<string>('/lm', {
      method: 'POST',
      data: formData,
    });
  }

  /**
   * Generates text with a streaming response.
   * @param options - Options for streaming text generation.
   * @returns An async generator that yields chunks of generated text.
   */
  async *generateTextStream(options: StreamGenerationOptions): AsyncGenerator<string> {
    const response = await this.request<ReadableStream>('/lm-stream', {
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
      if (done) break;

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
  async uploadFile(name: string, file: Blob, contentType?: string, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<string>(`/file/${name}`, {
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
  async runStableTask(options: StableTaskOptions): Promise<string> {
    const formData = options.imageData;
    formData.append('task', options.task);
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    return this.request<string>('/image-stable', {
      method: 'POST',
      data: formData,
    });
  }

  /**
   * Generates an image using the workflow endpoint.
   * @param options - Options for workflow image generation.
   * @returns A promise that resolves with the URL of the generated image.
   */
  async generateWorkflowImage(options: WfImageGenerationOptions): Promise<string> {
    return this.request<string>('/wf/image-imagine', {
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

  /**
   * Generates an image.
   * @param options - Options for image generation.
   * @returns A promise that resolves with the URL of the generated image.
   */
  async generateImage(options: ImageGenerationOptions): Promise<string> {
    return this.request<string>('/image-imagine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(options),
    });
  }

  /**
   * Performs visual analysis tasks.
   * @param options - Options for visual tasks.
   * @returns A promise that resolves with the analysis result.
   */
  async analyzeImage(options: VisualTaskOptions): Promise<any> {
    const formData = new FormData();
    formData.append('task', options.task);

    if (options.imageUrl) {
      formData.append('image_url', options.imageUrl);
    }
    if (options.file) {
      formData.append('file', options.file);
    }
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }
    if (options.width) {
      formData.append('width', options.width.toString());
    }
    if (options.height) {
      formData.append('height', options.height.toString());
    }

    return this.request<any>('/image-task', {
      method: 'POST',
      data: formData,
    });
  }

  /**
   * Edits an image based on a text prompt.
   * @param options - Options for image editing.
   * @returns A promise that resolves with the URL of the edited image.
   */
  async editImage(options: ImageEditOptions): Promise<string> {
    const formData = new FormData();
    formData.append('prompt', options.prompt);
    formData.append('aspect_ratio', options.aspectRatio);

    if (options.imageUrl) {
      formData.append('image_url', options.imageUrl);
    }
    if (options.file) {
      formData.append('file', options.file);
    }

    return this.request<string>('/image-edit', {
      method: 'POST',
      data: formData,
    });
  }

  /**
   * Inpaints an image.
   * @param options - Options for image inpainting.
   * @returns A promise that resolves with the URL of the inpainted image.
   */
  async inpaintImage(options: InpaintOptions): Promise<string> {
    const formData = new FormData();
    formData.append('prompt', options.prompt);

    if (options.imageUrl) {
      formData.append('image_url', options.imageUrl);
    }
    if (options.imageFile) {
      formData.append('image_file', options.imageFile);
    }
    if (options.maskUrl) {
      formData.append('mask_url', options.maskUrl);
    }
    if (options.maskFile) {
      formData.append('mask_file', options.maskFile);
    }

    return this.request<string>('/image-fill', {
      method: 'POST',
      data: formData,
    });
  }

  /**
   * Generates speech from text.
   * @param options - Options for voice synthesis.
   * @returns A promise that resolves with the URL of the generated speech.
   */
  async speak(options: SpeakOptions): Promise<string> {
    return this.request<string>('/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(options),
    });
  }

  /**
   * Clones a voice.
   * @param options - Options for voice cloning.
   * @returns A promise that resolves with the URL of the cloned voice.
   */
  async cloneVoice(options: VoiceCloneOptions): Promise<string> {
    const formData = new FormData();
    formData.append('prompt', options.prompt);
    formData.append('ref_text', options.refText);

    if (typeof options.refAudio === 'string') {
      formData.append('ref_audio', options.refAudio);
    } else {
      formData.append('ref_audio', options.refAudio);
    }

    return this.request<string>('/clone-voice', {
      method: 'POST',
      data: formData,
    });
  }

  /**
   * Uploads multiple files.
   * @param files - Array of files to upload.
   * @returns A promise that resolves with an array of URLs of the uploaded files.
   */
  async uploadFiles(files: Blob[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    return this.request<string[]>('/files', {
      method: 'PUT',
      data: formData,
    });
  }

  /**
   * Bulk describes images.
   * @param images - Array of image URLs or files.
   * @returns A promise that resolves with the description results.
   */
  async bulkDescribeImages(images: (string | Blob)[]): Promise<any> {
    const formData = new FormData();

    images.forEach(image => {
      if (typeof image === 'string') {
        formData.append('images', image);
      } else {
        formData.append('files', image);
      }
    });

    return this.request<any>('/image-bulk-describe', {
      method: 'POST',
      data: formData,
    });
  }

  /**
   * Generates a video from an image and prompt.
   * @param options - Options for video generation.
   * @returns A promise that resolves with the URL of the generated video.
   */
  async generateVideo(options: VideoGenerationOptions): Promise<string> {
    return this.request<string>('/runway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(options),
    });
  }

  /**
   * Checks the status of video generation.
   * @param id - The ID of the video generation task.
   * @returns A promise that resolves with the status of the video generation.
   */
  async checkVideoStatus(id: string): Promise<string> {
    return this.request<string>(`/runway?id=${id}`, {
      method: 'GET',
    });
  }

  /**
   * Synthesizes audio from text.
   * @param options - Options for audio synthesis.
   * @returns A promise that resolves with the URL of the synthesized audio.
   */
  async synthesizeAudio(options: AudioSynthesisOptions): Promise<string> {
    return this.request<string>('/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(options),
    });
  }
}


