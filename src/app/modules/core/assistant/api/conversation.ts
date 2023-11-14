import { Message } from "./message";

export interface Conversation {
  id: number;
  is_private: boolean;
  is_shared: boolean;
  topic: string;
  use_model: string | null;
  top_k: number;
  top_p: number;
  temperature: number;
  seed: number | null;
  system_message: string | null;
  icon: string;
  messages: Message[];
  router_config: string | null | string[];
  created_at: Date | null;
  updated_at: Date | null;
}
