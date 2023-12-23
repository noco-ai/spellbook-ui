export interface ChatData {
  temperature: number;
  system_message: string;
  top_k: number;
  top_p: number;
  min_p: number;
  seed: number;
  mirostat: number;
  mirostat_eta: number;
  mirostat_tau: number;
  examples: string;
  unique_key: string;
  id?: number;
  created_at?: number;
  updated_at?: number;
}
