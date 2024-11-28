import { Hono } from "hono";
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import OpenAI from "openai";
import { fal } from "@fal-ai/client";
import * as tasks from './tasks'
import * as seive from './sieve'
import * as stable from './stable'
import { PROMPT_TRANSLATOR, TASK_CAPTION, TASK_SCENE_DESCRIBE, TASK_SUBJECT_DESCRIBE, TASK_UI_DESCRIBE } from "./prompt";
import { uploadMedia } from "./r2";

const Bindings = {
  FAL_KEY: Bun.env['FAL_KEY']!,
  RUNWAY_KEY: Bun.env['RUNWAY_KEY']!,
  IDEOGRAM_KEY: Bun.env['IDEOGRAM_KEY']!,
  CARTESIA_KEY: Bun.env['CARTESIA_KEY']!,
  SIEVE_KEY: Bun.env['SIEVE_KEY']!,
  HYPERBOLIC_KEY: Bun.env['HYPERBOLIC_KEY']!,
  STABILITY_KEY: Bun.env['STABILITY_KEY']!,
  R2_MEDIA_URL: Bun.env['R2_MEDIA_URL']!,
};

const translate = async (prompt: string) => {
  const result = await tasks.write({
    prompt, system_prompt: PROMPT_TRANSLATOR, model: "openai/gpt-4o-mini",
  });

  const output = result.trim()
  if (output == "NONE") return prompt
  return output
}

const reupMedia = async (url: string) => {
  let name = url.slice(url.lastIndexOf("/") + 1)
  if (name.includes("?")) {
    name = name.slice(0, name.indexOf("?"))
  }

  const f = await fetch(url);
  const blob = await f.blob();
  await uploadMedia(name, blob);
  return Bindings.R2_MEDIA_URL + name
}

fal.config({ credentials: Bindings.FAL_KEY })

const app = new Hono();
app.use("*", cors({
  origin: "*",
  allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'OPTIONS']
}))

app.put("/file/:name", async (c) => {
  const name = c.req.param("name");
  const body = await c.req.blob();
  const file = new File([body], name, { type: c.req.header("Content-Type") });

  const url = await fal.storage.upload(file);
  return c.text(url);
});

app.post("/lm", async (c) => {
  const form = await c.req.formData();
  const model = form.get("model");
  let prompt = form.get("prompt") as string;
  if (!prompt || !model) {
    return c.text("Invalid input schema.", 400);
  }

  const acceptLanguage = c.req.header("Accept-Language") || "en";
  if (acceptLanguage != "en") {
    prompt = await translate(prompt);
    // use language map
    prompt += " Provide answer in Vietnamese."
  }

  let image_url = form.get("image_url") as string;
  if (!image_url) {
    let file = form.get("file") as unknown as Blob;
    if (file) {
      image_url = await fal.storage.upload(file);
    }
  }

  let system_prompt = form.get("system_prompt");
  if (!system_prompt) {
    system_prompt = "You are a helpful assistant akin Jarvis to Iron Man. Be concise and precise.";
  }

  const output = await tasks.write({ prompt, system_prompt, model, image_url, });
  return c.text(output);
});

app.post("/lm-stream", async (c) => {
  const { messages, temp = 0 } = await c.req.json<{ messages: string[], temp: number }>();

  if (!messages?.length) {
    return c.text("Invalid input schema.", 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      const openai = new OpenAI({
        apiKey: Bindings.HYPERBOLIC_KEY,
        baseURL: "https://api.hyperbolic.xyz/v1",
      });
      const completion = await openai.chat.completions.create({
        model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        messages,
        max_tokens: 8192,
        temperature: temp,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          stream.writeSSE({ data: content });
        }
      }
    } catch (error) {
      stream.writeSSE({ data: `[ERROR] ${error}` });
    } finally {
      stream.close()
    }
  })
});

type VisualTask = 'caption' | 'scene_describe' | 'ui_describe' | 'subject_describe'

const VISUAL_PROMPT: Record<VisualTask, string> = {
  "caption": TASK_CAPTION,
  "ui_describe": TASK_UI_DESCRIBE,
  "scene_describe": TASK_SCENE_DESCRIBE,
  "subject_describe": TASK_SUBJECT_DESCRIBE,
}
const USER_PROMPT: Record<VisualTask, string> = {
  "caption": "Please caption this image. If there are any specific requirements or additional context, I'll incorporate them.",
  "scene_describe": "Please describe the scene in this image. Include any additional details if specified.",
  "ui_describe": "Please describe the user interface elements in this image. Note any specific aspects if requested.",
  "subject_describe": "Please describe the main subject in this image. Include any particular focus areas if mentioned.",
}

app.post("/image-task", async (c) => {
  const form = await c.req.formData();
  const task = form.get("task") as string;
  if (!task) {
    return c.text("Invalid input schema.", 400);
  }

  let image_url = form.get("image_url") as string;
  if (!image_url) {
    let file = form.get("file") as unknown as Blob;
    if (file) {
      image_url = await fal.storage.upload(file);
    }
  }
  if (!image_url) {
    return c.text("Invalid input schema.", 400);
  }

  let prompt = form.get("prompt") as string;
  if (prompt) {
    let acceptLanguage = c.req.header("Accept-Language") || "en";
    if (acceptLanguage != "en") {
      prompt = await translate(prompt);
    }
  }

  if (task == 'rembg') {
    const result = await tasks.birefnet(image_url)
    return c.json(result)
  } else if (task == 'upscale') {
    const result = await tasks.upscale(image_url)
    return c.json(result)
  } else if (task == 'recraft-style') {
    const result = await tasks.recraftCreateStyle(image_url, form.get("prompt") as string)
    return c.json(result)
  } else if (task == 'subject') {
    const result = await tasks.imagen(
      "fal-ai/flux-subject", {
        prompt,
        image_url,
        image_size: {
          width: +form.get("width")!,
          height: +form.get("height")!,
        },
        enable_safety_checker: false,
        output_format: "jpeg",
      })
    let url = await reupMedia(result)
    return c.json({ url })
  }

  if (!VISUAL_PROMPT[task as VisualTask]) {
    return c.notFound()
  }

  let taskPrompt = USER_PROMPT[task as VisualTask]
  if (prompt) {
    prompt = ' For extra request/context: ' + prompt
  } else {
    prompt = ' No extra request or context is provided.'
  }
  prompt = taskPrompt + prompt

  const output = await tasks.write({
    prompt, image_url,
    system_prompt: VISUAL_PROMPT[task as VisualTask],
    model: "google/gemini-flash-1.5",
  });
  return c.json({ text: output });
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

app.put("/files", async (c) => {
  const form = await c.req.formData();
  const files = form.getAll("files"); // "files" is the field name for multiple files
  const results = [];

  for (const file of files) {
    if (!(file instanceof Blob)) {
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.text(`File ${file.name} exceeds 5MB limit`, 413);
    }

    const url = await fal.storage.upload(file);
    results.push(url);
  }

  return c.json(results);
});

app.post("/image-bulk-describe", async (c) => {
  let form = await c.req.formData();
  let images = form.getAll("images") as string[];
  if (images?.length == 0) {
    let files = form.getAll("files") as unknown as Blob[];
    for (const file of files) {
      images.push(await fal.storage.upload(file));
    }
  }

  const result = await tasks.batchDescribe(images);
  return c.json(result);
})

app.post("/image-edit", async (c) => {
  let formData = await c.req.formData();
  let prompt = formData.get("prompt") as string;
  let aspect_ratio = formData.get("aspect_ratio") as string;
  if (!prompt || !aspect_ratio) {
    return c.text("prompt and aspect_ratio are required", 400);
  }

  let image_url = formData.get("image_url") as string;
  if (!image_url) {
    let file = formData.get("file") as Blob;
    if (file) {
      image_url = await fal.storage.upload(file);
    }
  }
  if (!image_url) {
    return c.text("image_url is required", 400);
  }

  const acceptLanguage = c.req.header("Accept-Language") || "en";
  if (acceptLanguage != "en") {
    prompt = await translate(prompt);
  }

  const imgUrl = await tasks.pulid(prompt, image_url, aspect_ratio)
  const imageName = await reupMedia(imgUrl);
  return c.text(imageName);
})

type ModelType = 'recraft' | 'quint' | 'quality' | 'quick';

const MODEL_PATHS: Record<ModelType, string> = {
  "recraft": "fal-ai/recraft-v3",
  "quint": "fal-ai/flux-pro/v1.1-ultra",
  "quality": "fal-ai/flux-pro/v1.1",
  "quick": "fal-ai/flux/schnell"
};

type ImagineReq = {
  model: ModelType,
  prompt: string,
  aspect_ratio: string,
  width: number,
  height: number,
  seed?: number,
  style: string,
  style_id?: string,
  redux?: string,
}
app.post("/image-imagine", async (c) => {
  let { model, prompt, style, width, height, aspect_ratio, style_id, redux, seed = 0 } = await c.req.json<ImagineReq>();
  if (!prompt) {
    return c.text("model and prompt are required", 400);
  }

  if (model === "recraft" && !style) {
    return c.text("style is required.", 400);
  }

  let modelPath = "fal-ai/flux-pro/v1.1-ultra/redux"
  if (!redux) {
    modelPath = MODEL_PATHS[model]
    if (!modelPath) {
      return c.text("invalid model.", 400);
    }
  }

  const acceptLanguage = c.req.header("Accept-Language") || "en";
  if (acceptLanguage != "en") {
    prompt = await translate(prompt);
  }

  const inputReq = {
    prompt: prompt.trim(),
    image_size: {
      width: width,
      height: height,
    },
    enable_safety_checker: false,
  } as Record<string, any>;

  if (model === "quint" || redux) {
    inputReq["safety_tolerance"] = 6;
    inputReq["raw"] = true;
    inputReq["aspect_ratio"] = aspect_ratio;
    delete inputReq["image_size"];

    if (redux) {
      inputReq["image_url"] = redux;
    }
  } else if (model === "recraft") {
    inputReq["style"] = style;
    if (style_id) {
      inputReq["style_id"] = style_id;
    }
  }

  if (seed > 0) {
    inputReq["seed"] = seed;
  }

  const imgUrl = await tasks.imagen(modelPath, inputReq);
  const imageName = await reupMedia(imgUrl);
  return c.text(imageName);
});

app.post("/image-inpaint", async (c) => {
  const body = await c.req.formData();

  const acceptLanguage = c.req.header("Accept-Language") || "en";
  if (acceptLanguage != "en") {
    const prompt = body.get("prompt") as string;
    body.set("prompt", await translate(prompt));
  }

  const f = await fetch("https://api.ideogram.ai/edit", {
    method: "POST",
    headers: { "Api-Key": Bindings.IDEOGRAM_KEY },
    body,
  });
  if (f.ok) {
    const json = await f.json<{ data: any }>();
    if (!json.data[0].url) {
      return c.text("image is not safe", 400);
    }

    const name = await reupMedia(json.data[0].url)
    return c.text(name);
  }
  return c.text(f.statusText, 400);
});

app.post("/image-fill", async (c) => {
  const body = await c.req.formData();

  const acceptLanguage = c.req.header("Accept-Language") || "en";
  let prompt = body.get("prompt") as string;
  if (acceptLanguage != "en") {
    prompt = await translate(prompt);
  }

  let image_url = body.get("image_url") as string;
  if (!image_url) {
    let file = body.get("image_file") as unknown as Blob;
    image_url = await fal.storage.upload(file);
  }
  let mask_url = body.get("mask_url") as string;
  if (!mask_url) {
    let file = body.get("mask_file") as unknown as Blob;
    mask_url = await fal.storage.upload(file);
  }

  let inputReq = {
    prompt,
    image_url, mask_url,
    safety_tolerance: "6"
  };
  const imgUrl = await tasks.imagen("fal-ai/flux-pro/v1/fill", inputReq);
  const imageName = await reupMedia(imgUrl);
  return c.text(imageName);
});

const STABLE_TASK_PATH: Record<string, string> = {
  "inpaint": "edit/inpaint",
  "upscale": "upscale/fast",
}
app.post("/image-stable", async (c) => {
  const body = await c.req.formData();

  const acceptLanguage = c.req.header("Accept-Language") || "en";
  if (acceptLanguage != "en") {
    const prompt = body.get("prompt") as string;
    body.set("prompt", await translate(prompt));
  }
  try {
    const task = body.get("task") as string;
    body.delete("task")

    const f = await stable.runTask(STABLE_TASK_PATH[task], body, Bindings.STABILITY_KEY)
    if (!f.ok) {
      throw new Error(`HTTP error! status: ${f.status}`);
    }

    const name = crypto.randomUUID() + '.png'
    const blob = await f.blob();
    await uploadMedia(name, blob);
    return c.text(Bindings.R2_MEDIA_URL + name)
  } catch (error) {
    return c.text(`Failed to inpaint image: ${error}`, 400);
  }
})

app.post("/runway", async (c) => {
  const { prompt, duration, ratio, seed, image } = await c.req.json();
  const f = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + Bindings.RUNWAY_KEY,
      "X-Runway-Version": "2024-11-06",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      promptImage: image,
      seed: seed,
      model: "gen3a_turbo",
      promptText: prompt,
      watermark: false,
      duration: duration,
      ratio: ratio,
    }),
  });
  if (f.ok) {
    const json = await f.json<{ id: string }>();
    return c.text(json.id);
  }

  return c.text("Rate limited by provider", 429);
});

app.get("/runway", async (c) => {
  const id = c.req.query("id");
  const f = await fetch("https://api.dev.runwayml.com/v1/tasks/" + id, {
    headers: {
      Authorization: "Bearer " + Bindings.RUNWAY_KEY,
      "X-Runway-Version": "2024-11-06",
    },
  });

  if (f.ok) {
    const json = await f.json<{
      status: string;
      failure?: string;
      output: string[];
    }>();
    if (json.status == 'SUCCEEDED') {
      const name = await reupMedia(json.output[0])
      return c.text(name)
    } else if (json.status == 'FAILED') {
      return c.text(json.failure!, 400)
    }
    return c.text('RUNNING')
  }

  return c.text("task is done, or canceled, or deleted", 404);
});

app.post("/synthesize", async (c) => {
  const json = await c.req.json();
  let prompt = json.prompt?.trim() ?? "";
  if (!prompt) {
    return c.text("prompt is required", 400);
  }

  const acceptLanguage = c.req.header("Accept-Language") || "en";
  if (acceptLanguage != "en") {
    prompt = await translate(prompt);
  }

  let result = await tasks.audio(prompt, json.duration)
  let url = await reupMedia(result)
  return c.text(url)
})

app.post("/clone-voice", async (c) => {
  let form = await c.req.formData();
  let prompt = form.get("prompt") as string;
  let ref_text = form.get("ref_text") as string;
  let ref_audio = form.get("ref_audio");
  if (!prompt || !ref_text || !ref_audio) {
    return c.text("invalid input schema", 400);
  }

  if (ref_audio instanceof Blob) {
    ref_audio = await fal.storage.upload(ref_audio);
  }

  let result = await tasks.voiceClone(ref_audio, ref_text, prompt)
  let url = await reupMedia(result)
  return c.text(url)
})

type SpeakReq = {
  transcript: string
  voice: string
  language: string
  controls: {
    speed: number
    emotion: string[]
  }
}
app.post("/speak", async (c) => {
  let { language, transcript, voice, controls } = await c.req.json<SpeakReq>()

  let model_id = language == 'en' ? 'sonic-english' : 'sonic-multilingual'
  let f = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      'Cartesia-Version': '2024-06-10',
      'X-API-Key': Bindings.CARTESIA_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model_id, transcript, language,
      voice: {
        mode: 'id',
        id: voice,
        __experimental_controls: controls
      },
      output_format: {
        "container": "wav",
        "encoding": "pcm_s16le",
        "sample_rate": 44100
      },
    })
  });

  if (!f.ok) {
    console.log(await f.text())
    return c.text('Failed to generate speech', 400);
  }

  const buffer = await f.arrayBuffer();
  const blob = new Blob([buffer], { type: 'audio/wav' });
  const name = crypto.randomUUID() + '.wav'
  await uploadMedia(name, blob);
  return c.text(Bindings.R2_MEDIA_URL + name)
})

type CreateAvatarReq = {
  visual_url: string;
  audio_url: string;
}
app.post("/avatar", async (c) => {
  const { visual_url, audio_url } = await c.req.json<CreateAvatarReq>();

  if (!visual_url || !audio_url) {
    return c.text("Visual and audio are required", 400);
  }

  try {
    const jobId = await seive.postJob({
      function: "sieve/portrait-avatar",
      inputs: {
        source_image: { url: visual_url },
        driving_audio: { url: audio_url },
        backend: "hedra-character-2",
        enhancement: "codeformer"
      }
    }, Bindings.SIEVE_KEY);
    return c.text(jobId);
  } catch (e) {
    return c.text(`Failed to create avatar: ${e}`, 404);
  }
});

app.get("/avatar/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const job = await seive.getJob(id, Bindings.SIEVE_KEY);
    return c.json(job);
  } catch (e) {
    return c.text(`Failed to get avatar job: ${e}`, 404);
  }
});

type WfImagineReq = {
  model: string,
  prompt: string,
  aspect_ratio: string,
  width: number,
  height: number,
  seed?: number,
}
app.post("/wf/image-imagine", async (c) => {
  let { model, prompt, aspect_ratio, seed = 0 } = await c.req.json<WfImagineReq>();
  if (!model || !prompt) {
    return c.text("model and prompt are required", 400);
  }

  const acceptLanguage = c.req.header("Accept-Language") || "en";
  if (acceptLanguage != "en") {
    prompt = await translate(prompt);
  }

  const inputReq = {
    prompt: prompt.trim(),
    image_size: aspect_ratio,
    enable_safety_checker: false,
  } as Record<string, any>;

  if (model === "flux-pro/v1.1-ultra") {
    inputReq["safety_tolerance"] = 6;
    inputReq["raw"] = true;
    inputReq["aspect_ratio"] = aspect_ratio;
    delete inputReq["image_size"];
  } else if (model === "recraft-v3") {
    inputReq["style"] = 'any';
  }

  if (seed > 0) {
    inputReq["seed"] = seed;
  }

  const imgUrl = await tasks.imagen('fal-ai/' + model, inputReq);
  return c.text(imgUrl);
});

export default {
  port: +Bun.env.AI_SERVER_PORT,
  fetch: app.fetch,
}
