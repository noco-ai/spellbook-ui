import { Message } from "./message";

export interface DigitalAllyTone {
  user: string;
  assistant: string;
}

export interface DigitalAlly {
  id: number;
  user_id: number;
  system_message?: string;
  use_model?: string;
  seed?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
  min_p?: number;
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
  router_config?: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  wake_words?: string;
  chat_round_limits?: number;
  voice?: string;
  location_image?: string;
  character_image?: string;
  short_description?: string;
  tag_line?: string;
  conversation_tone?: string;
  loaded_tones: DigitalAllyTone[];
}
