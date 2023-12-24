interface CompletionRequest {
  top_k: number;
  top_p: number;
  min_p: number;
  raw: string;
  seed: number;
  temperature: number;
  mirostat: number;
  mirostat_eta: number;
  mirostat_tau: number;
  use_model: string;
  max_new_tokens: number;
  socket_id?: string;
}
