import { Message } from "./message";

export interface Conversation {
  id: number;
  ally_id: number;
  is_private: boolean;
  is_shared: boolean;
  topic: string;
  use_model: string | null;
  top_k: number;
  top_p: number;
  min_p: number;
  mirostat: number;
  mirostat_eta: number;
  mirostat_tau: number;
  temperature: number;
  seed: number | null;
  first_message_id: number;
  system_message: string | null;
  icon: string;
  messages: Message[];
  router_config: string | null | string[];
  created_at: Date | null;
  updated_at: Date | null;
}
