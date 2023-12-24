import { GeneratedImageCore } from "./generated-image";

export interface GeneratedImageSettings extends GeneratedImageCore {
  num_generations: number;
  use_models: string[];
}
