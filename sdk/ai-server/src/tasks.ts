import { fal } from "@fal-ai/client";

export async function audio(prompt: string, duration = 5) {
  const result = await fal.subscribe(
    "fal-ai/stable-audio", {
      logs: false, input: { prompt, seconds_total: duration }
  });
  return result.data.audio_file.url;
}

export async function voiceClone(refAudioUrl: string, refText: string, genText: string) {
  const result = await fal.subscribe(
    "fal-ai/f5-tts", {
    logs: false,
    input: {
      ref_audio_url: refAudioUrl,
      ref_text: refText,
      gen_text: genText,
      model_type: "F5-TTS",
      remove_silence: true,
    }
  });
  return result.data.audio_url.url;
}

export async function imagen(endpoint: string, args: Record<string, any>) {
  const result = await fal.subscribe(endpoint, { logs: false, input: args });

  return result.data.images[0].url;
}

export async function birefnet(image_url: string) {
  const result = await fal.subscribe(
    "fal-ai/birefnet/v2",
    {
      logs: false,
      input: {
        image_url,
        model: "General Use (Light)",
        operating_resolution: "2048x2048",
        output_format: "png",
        refine_foreground: true,
        output_mask: true
      }
    }
  );
  return {
    image: result.data.image.url,
    mask: result.data.mask_image?.url,
  }
}

export async function pulid(prompt: string, image_url: string, image_size: string) {
  const result = await fal.subscribe(
    "fal-ai/flux-pulid",
    {
      logs: false,
      input: {
        "prompt": prompt,
        "reference_image_url": image_url,
        "image_size": image_size,
        "true_cfg": 1,
        "guidance_scale": 4,
        "id_weight": 1,
        "negative_prompt": "bad quality, worst quality, text, signature, watermark, extra limbs, bad anatomy, 6 fingers",
        "max_sequence_length": 128,
        "num_inference_steps": 20,
        "enable_safety_checker": false
      }
    }
  );
  return result.data.images[0].url
}

export async function relight(image_url: string, prompt: string) {
  const result = await fal.subscribe(
    "fal-ai/iclight-v2", {
    logs: false, input: { image_url, prompt, enable_hr_fix: true, }
  }
  );
  return result.data.images[0].url;
}

export async function upscale(image_url: string) {
  const result = await fal.subscribe(
    "fal-ai/aura-sr", {
    logs: false,
    input: {
      image_url,
      checkpoint: "v2",
      upscaling_factor: 4,
      overlapping_tiles: true,
    }
  }
  );
  return result.data.image;
}

export async function recraftCreateStyle(images_data_url: string, base_style: string) {
  const result = await fal.subscribe(
    "fal-ai/recraft-v3/create-style", { logs: false, input: { images_data_url, base_style } }
  );
  return result.data.style_id;
}

export async function write(args: Record<string, any>) {
  let endpoint = 'fal-ai/any-llm'
  if (args.image_url) endpoint += '/vision'
  const result = await fal.subscribe(endpoint, { input: args, logs: false, });

  return result.data.output
}

export async function batchDescribe(images: string[]) {
  const inputs = images.map((image) => ({ image_url: image }));
  const result = await fal.subscribe("fal-ai/moondream/batched", {
    input: { inputs, max_tokens: 1024 }, logs: false
  });
  return result.data.outputs;
}
