export interface AIClientConfig {
    baseUrl: string;
    language?: string;
}
export interface TextGenerationOptions {
    prompt: string;
    model: string;
    systemPrompt?: string;
    imageUrl?: string;
    file?: Blob;
}
export interface StreamGenerationOptions {
    prompt: string;
    systemPrompt: string;
    temp?: number;
}
export interface ImageGenerationOptions {
    model: 'recraft' | 'quint' | 'quality' | 'quick';
    prompt: string;
    aspectRatio: string;
    width: number;
    height: number;
    seed?: number;
    style?: string;
    styleId?: string;
    redux?: string;
}
export interface VisualTaskOptions {
    task: 'caption' | 'scene_describe' | 'ui_describe' | 'subject_describe' | 'rembg' | 'upscale' | 'recraft-style' | 'subject';
    imageUrl?: string;
    file?: Blob;
    prompt?: string;
    width?: number;
    height?: number;
}
export interface ImageEditOptions {
    prompt: string;
    aspectRatio: string;
    imageUrl?: string;
    file?: Blob;
}
export interface InpaintOptions {
    prompt: string;
    imageUrl?: string;
    imageFile?: Blob;
    maskUrl?: string;
    maskFile?: Blob;
}
export interface SpeakOptions {
    transcript: string;
    voice: string;
    language: string;
    controls: {
        speed: number;
        emotion: string[];
    };
}
export interface VoiceCloneOptions {
    prompt: string;
    refText: string;
    refAudio: string | Blob;
}
export interface VideoGenerationOptions {
    prompt: string;
    duration: number;
    ratio: string;
    seed?: number;
    image: string;
}
export interface AudioSynthesisOptions {
    prompt: string;
    duration?: number;
}
export interface StableTaskOptions {
    task: 'inpaint' | 'upscale';
    prompt?: string;
    imageData: FormData;
}
export interface WfImageGenerationOptions {
    model: string;
    prompt: string;
    aspectRatio: string;
    seed?: number;
}
