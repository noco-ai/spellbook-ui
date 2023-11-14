import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, EventEmitter } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Message, Block } from "../api/message";
import { Conversation } from "../api/conversation";
import { CursorUpdate } from "../api/cursor";
import { ModelOptions } from "../api/model-options";
import { ProgressUpdate } from "../api/progress-update";
import { SocketService } from "src/app/service/sockets.service";
import { GraphqlService } from "src/app/service/graphql.service";
import { marked } from "marked";

@Injectable()
export class AssistantService {
  progressBarUpdate: EventEmitter<ProgressUpdate> =
    new EventEmitter<ProgressUpdate>();
  incomingMessage: EventEmitter<Message> = new EventEmitter<Message>();
  incomingFragment: EventEmitter<string> = new EventEmitter<string>();
  updateIcons: EventEmitter<string[]> = new EventEmitter<string[]>();
  onlineLanguageModels: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  updateCursor: EventEmitter<CursorUpdate> = new EventEmitter<CursorUpdate>();
  conversationList: EventEmitter<Conversation[]> = new EventEmitter<
    Conversation[]
  >();
  conversationMessages: EventEmitter<Message[]> = new EventEmitter<Message[]>();

  emptyConversation: Conversation = {
    id: 0,
    topic: "New Conversation",
    icon: "",
    is_private: true,
    is_shared: false,
    top_k: 0.9,
    top_p: 0.9,
    temperature: 1.0,
    system_message: null,
    use_model: null,
    seed: -1,
    messages: [],
    created_at: null,
    updated_at: null,
    router_config: [
      "function_calling",
      "model_routing",
      "pin_functions",
      "pin_models",
    ],
  };

  _activeConversation: Conversation = JSON.parse(
    JSON.stringify(this.emptyConversation)
  );

  private activeConversation = new BehaviorSubject<Conversation>(
    this._activeConversation
  );

  activeConversation$ = this.activeConversation.asObservable();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private graphqlService: GraphqlService
  ) {
    this.socketService.subscribeToEvent(
      "prompt_response",
      (message: Message) => {
        if (this._activeConversation.id === 0) {
          this._activeConversation.id = message.conversation_id;
        }
        this.incomingMessage.emit(message);
      }
    );

    this.socketService.subscribeToEvent(
      "chat_progress_bar",
      (data: ProgressUpdate) => {
        this.progressBarUpdate.emit(data);
      }
    );

    this.socketService.subscribeToEvent(
      "prompt_cursor",
      (data: CursorUpdate) => {
        this.updateCursor.emit(data);
      }
    );

    this.socketService.subscribeToEvent("prompt_fragment", (text: string) => {
      this.incomingFragment.emit(text);
    });

    this.socketService.subscribeToEvent("prompt_icons", (iconData: any) => {
      this.updateIcons.emit(iconData);
    });

    this.socketService.subscribeToEvent(
      "online_language_models",
      (models: ModelOptions[]) => {
        this.onlineLanguageModels.emit(models);
      }
    );
  }

  async uploadFile(files: any, callback: any = null) {
    this.socketService.uploadFile(
      files,
      this._activeConversation.id,
      (response: any) => {
        if (callback) {
          callback(response);
        }
      }
    );
  }

  async getOnlineLanguageModels() {
    await this.socketService.send("command", {
      command: "get_online_language_models",
    });
  }

  async getConversations() {
    const query = `query { getConversation { id, topic, is_private, is_shared, created_at, updated_at, seed, top_p, top_k, seed, temperature, system_message, use_model, router_config } }`;
    this.graphqlService.sendQuery(query, {}).subscribe((data) => {
      const conversations: Conversation[] = data.data.getConversation;
      const list: Conversation[] = [];
      for (let i = 0; i < conversations.length; i++) {
        const conversation = conversations[i];
        const routerConfig = Array.isArray(conversation.router_config)
          ? conversation.router_config
          : conversation.router_config?.split(",") || null;
        list.push({
          id: conversation.id,
          topic: conversation.topic,
          is_private: conversation.is_private,
          is_shared: conversation.is_shared,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          temperature: conversation.temperature,
          seed: conversation.seed,
          system_message: conversation.system_message || "",
          top_k: conversation.top_k,
          top_p: conversation.top_p,
          use_model: conversation.use_model,
          router_config: routerConfig,
          icon: "",
          messages: [],
        });
      }
      this.conversationList.emit(list);
    });
  }

  resetConversation() {
    this._activeConversation = JSON.parse(
      JSON.stringify(this.emptyConversation)
    );
    this.activeConversation.next(this._activeConversation);
    this.socketService.send("command", {
      command: "reset_workspace",
      conversation_id: 0,
    });
  }

  async deleteConversation(conversationId: number) {
    const query = `mutation Message($id: Int!) { deleteConversation(id: $id) { id } }`;
    this.graphqlService
      .sendQuery(query, { id: conversationId })
      .subscribe((data) => {});
  }

  async updateConversation(conversation: Conversation) {
    const query = `mutation Message($id: Int!, $topic: String!, $system_message: String!, $use_model: String!, $seed: Int!, $top_p: Float!, $top_k: Float!, $temperature: Float!, $router_config: String!) { updateConversation(id: $id, topic: $topic, system_message: $system_message, use_model: $use_model, seed: $seed, top_p: $top_p, top_k: $top_k, temperature: $temperature, router_config: $router_config ) { id } }`;
    conversation.seed = parseInt("" + conversation.seed);
    const routerConfig = Array.isArray(conversation.router_config)
      ? conversation.router_config.join(",")
      : conversation.router_config;

    this.graphqlService
      .sendQuery(query, {
        id: conversation.id,
        topic: conversation.topic,
        system_message: conversation.system_message,
        use_model: conversation.use_model,
        seed: conversation.seed,
        top_p: conversation.top_p,
        top_k: conversation.top_k,
        temperature: conversation.temperature,
        router_config: routerConfig,
      })
      .subscribe((data) => {
        this.getConversations();
      });
  }

  async deleteConversationMessages(messageId: number) {
    const query = `mutation Message($id: Int!) { deleteConversationMessage(id: $id) { id } }`;
    this.graphqlService
      .sendQuery(query, { id: messageId })
      .subscribe((data) => {});
  }

  async getConversationMessages(conversationId: number) {
    const query = `query Message($id: Int!) { getConversationMessages(conversation_id: $id) { id, icon, shortcuts, content, role, conversation_id, parent_id, active_child_id, num_children, created_at, files } }`;
    this.graphqlService
      .sendQuery(query, { id: conversationId })
      .subscribe((data) => {
        const messages = data.data.getConversationMessages;
        const list: Message[] = [];
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          const useBlocks =
            message.role === "user"
              ? []
              : this.parseMarkdownBlocks(message.content);
          const useContent = message.role === "user" ? message.content : "";
          list.push({
            id: message.id,
            role: message.role,
            icon: message.icon.split(","),
            created_at: parseInt(message.created_at),
            conversation_id: message.conversation_id,
            parent_id: message.parent_id,
            shortcuts: message.shortcuts,
            content: useContent,
            raw: message.content,
            blocks: useBlocks,
            is_editing: false,
            files: message.files ? message.files : "",
            filesList: message.files ? message.files.split(",") : [],
          });
        }
        this.conversationMessages.emit(list);
        this.socketService.send("command", {
          command: "reset_workspace",
          conversation_id: conversationId,
        });
      });
  }

  encodeHtml(html: string): string {
    const replacements: { [key: string]: string } = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#039;",
    };

    // encode < and > globally
    html = html.replace(/[<>]/g, (symbol) => replacements[symbol]);

    // match tags and replace " and ' inside them
    html = html.replace(/&lt;[^&]*&gt;/g, (tag) => {
      return tag.replace(/["']/g, (symbol) => replacements[symbol]);
    });

    return html;
  }

  parseMarkdownBlocks(input: string): Array<Block> {
    let blocks: Array<Block> = [];
    if (!input) return blocks;

    let splitText = input.split(/(```)/);
    let codeFlag = false;
    let splitBlocks = [];
    for (let i = 0; i < splitText.length; i++) {
      if (splitText[i] === "```") {
        if (codeFlag) {
          splitBlocks[splitBlocks.length - 1] += splitText[i];
          codeFlag = false;
        } else {
          codeFlag = true;
          splitBlocks.push(splitText[i]);
        }
      } else {
        if (codeFlag) {
          splitBlocks[splitBlocks.length - 1] += splitText[i];
        } else {
          splitBlocks.push(splitText[i]);
        }
      }
    }

    for (let i = 0; i < splitBlocks.length; i++) {
      const block = splitBlocks[i];
      const content = marked(block, {
        mangle: false,
        headerIds: false,
      });
      if (block.startsWith("```")) {
        blocks.push({
          type: "code",
          content: content,
          raw: block.replace(/.*?\n/, ""),
        });
      } else {
        blocks.push({ type: "text", content: content, raw: block });
      }
    }
    return blocks;
  }

  stopGeneration() {
    this.socketService.send("command", {
      command: "stop_generation",
    });
  }

  changeActiveChat(conversation: Conversation) {
    this._activeConversation = conversation;
    this.activeConversation.next(conversation);
  }

  sendMessage(message: Message, payload: any) {
    const lastMessage =
      this._activeConversation.messages[
        this._activeConversation.messages.length - 1
      ];
    this._activeConversation.messages.push(message);
    this.activeConversation.next(this._activeConversation);
    payload.conversation_id = this._activeConversation.id;
    payload.top_p = this._activeConversation.top_p;
    payload.top_k = this._activeConversation.top_k;
    payload.seed = this._activeConversation.seed;
    payload.router_config = Array.isArray(
      this._activeConversation.router_config
    )
      ? this._activeConversation.router_config.join(",")
      : this._activeConversation.router_config;
    payload.temperature = this._activeConversation.temperature;
    payload.system_message = this._activeConversation.system_message;
    payload.use_model = this._activeConversation.use_model;
    payload.topic = this._activeConversation.topic;
    payload.parent_id = lastMessage ? lastMessage.id : 0;
    payload.files = message.files;
    this.socketService.send("prompt", payload);
  }

  getSocketUrl() {
    return this.socketService.getBaseUrl();
  }
}
