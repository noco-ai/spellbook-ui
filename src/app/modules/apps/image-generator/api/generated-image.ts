export interface GeneratedImageCore {
  prompt: string;
  negative_prompt: string;
  guidance_scale: number;
  steps: number;
  height: number;
  width: number;
  seed: number;
}

export interface GeneratedImage extends GeneratedImageCore {
  image_url: string;
  created_at: number;
  model_name: string;
  id: number;
}
