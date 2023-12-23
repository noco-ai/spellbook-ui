import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, EventEmitter } from "@angular/core";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import { SocketService } from "src/app/service/sockets.service";
import { GraphqlService } from "src/app/service/graphql.service";
import { ChatData } from "../api/chat-data";

@Injectable()
export class LlmExplorerService {
  onlineLanguageModels: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  chatList: EventEmitter<ChatData[]> = new EventEmitter<ChatData[]>();
  outputUpdate: EventEmitter<string> = new EventEmitter<string>();
  outputFragmentUpdate: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private graphqlService: GraphqlService
  ) {
    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_online_language_models",
      (resp: any) => {
        this.onlineLanguageModels.emit(resp.models);
      }
    );

    this.socketService.subscribeToEvent(
      "prompt_response_simple",
      (fragment: string) => {
        this.outputFragmentUpdate.emit(fragment);
      }
    );
  }

  calculateRows(content: string, lineAverage: number = 80): number {
    const lines = content.split("\n");
    let count = 0;

    for (const line of lines) {
      const lineLength = line.length;
      const virtualLines = Math.ceil(lineLength / lineAverage);
      count += virtualLines;
    }
    return count < 5 ? 5 : count;
  }

  stopGeneration(modelName: string) {
    this.socketService.send("command", {
      command: "llm_explorer_stop_generation",
      socket_id: this.socketService.getSocketId(),
      routing_key: modelName,
    });
  }

  async executeCompletion(payload: CompletionRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      const httpOptions = {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          Authorization: this.socketService.getToken(),
        }),
      };
      payload.socket_id = this.socketService.getSocketId();
      const url = this.socketService.getBaseUrl() + `api/v1/completion`;
      this.http.post<any>(url, payload, httpOptions).subscribe((data) => {
        this.outputUpdate.emit(data.payload);
        resolve();
      });
    });
  }

  async executeChat(
    input: string,
    uniqueKey: string,
    useModel: string,
    maxNewTokens: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const httpOptions = {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          Authorization: this.socketService.getToken(),
        }),
      };

      const body = {
        input: input,
        unique_key: uniqueKey,
        socket_id: this.socketService.getSocketId(),
        use_model: useModel,
        max_new_tokens: maxNewTokens,
      };

      const url = this.socketService.getBaseUrl() + `api/v1/chat/${uniqueKey}`;
      this.http.post<any>(url, body, httpOptions).subscribe((data) => {
        this.outputUpdate.emit(data.payload);
        resolve();
      });
    });
  }

  async getOnlineLanguageModels() {
    await this.socketService.send("command", {
      command: "get_online_language_models",
    });
  }

  async getChats() {
    const query = `query { getLlmExplorerChat { id, created_at, updated_at, unique_key, examples, top_p, top_k, temperature, system_message, seed, mirostat, mirostat_eta, mirostat_tau, min_p } }`;
    this.graphqlService.sendQuery(query, {}).subscribe((data) => {
      const chat: ChatData[] = data.data.getLlmExplorerChat;
      this.chatList.emit(chat);
    });
  }

  async deleteChat(chatId: number): Promise<void> {
    return new Promise((resolve) => {
      const query = `mutation deleteLlmExplorerChat($id: Int!) { deleteLlmExplorerChat(id: $id) { id } }`;
      this.graphqlService.sendQuery(query, { id: chatId }).subscribe((data) => {
        resolve();
      });
    });
  }

  async updateChat(chat: ChatData, callback: Function) {
    const query =
      `mutation LlmExplorerChat($examples: String!, $system_message: String!, $top_p: Float!, $top_k: Int!, $temperature: Float!, $unique_key: String!, $seed: Float!, $min_p: Float!, $mirostat: Int!, $mirostat_eta: Float!, $mirostat_tau: Float!)` +
      ` { updateLlmExplorerChat(examples: $examples, system_message: $system_message, top_p: $top_p, top_k: $top_k, temperature: $temperature, unique_key: $unique_key, seed: $seed, min_p: $min_p, mirostat: $mirostat, mirostat_eta: $mirostat_eta, mirostat_tau: $mirostat_tau ) { id } }`;
    this.graphqlService
      .sendQuery(query, {
        examples: chat.examples,
        system_message: chat.system_message,
        top_p: chat.top_p,
        top_k: chat.top_k,
        min_p: chat.min_p,
        mirostat: chat.mirostat,
        mirostat_eta: chat.mirostat_eta,
        mirostat_tau: chat.mirostat_tau,
        seed: chat.seed,
        temperature: chat.temperature,
        unique_key: chat.unique_key,
      })
      .subscribe((data) => {
        this.getChats();
        if (data && callback) callback(data.data.updateLlmExplorerChat.id);
      });
  }
}
