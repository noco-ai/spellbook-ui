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
import { GeneratedImage } from "src/app/modules/apps/image-generator/api/generated-image";
import { DigitalAlly } from "../api/digital-allies";

@Injectable()
export class AssistantService {
  progressBarUpdate: EventEmitter<ProgressUpdate> =
    new EventEmitter<ProgressUpdate>();
  digitalAllies: EventEmitter<any> = new EventEmitter<any>();
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
  ttsModelList: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  asrModelList: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  imageList: EventEmitter<GeneratedImage[]> = new EventEmitter<
    GeneratedImage[]
  >();
  voiceFiles: EventEmitter<any[]> = new EventEmitter<any[]>();

  emptyConversation: Conversation = {
    id: 0,
    topic: "New Conversation",
    icon: "",
    is_private: true,
    is_shared: false,
    ally_id: 0,
    top_k: 50,
    top_p: 0.9,
    min_p: 0.05,
    mirostat: 0,
    mirostat_eta: 0.1,
    mirostat_tau: 5,
    temperature: 1.0,
    system_message: null,
    first_message_id: 0,
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

    this.socketService.subscribeToEventWithFilter(
      "progress_bar_update",
      "target",
      "chat_progress",
      (data: ProgressUpdate) => {
        this.progressBarUpdate.emit(data);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "switch_message_chain",
      (resp: any) => {
        this.getConversationMessages(
          this._activeConversation.id,
          this._activeConversation.first_message_id
        );
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

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_online_language_models",
      (resp: any) => {
        this.onlineLanguageModels.emit(resp.models);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_online_skills",
      (resp) => {
        const ttsList =
          !resp.skills || !resp.skills["text_to_speech"]
            ? []
            : resp.skills["text_to_speech"];
        const asrList =
          !resp.skills || !resp.skills["automatic_speech_recognition"]
            ? []
            : resp.skills["automatic_speech_recognition"];
        this.ttsModelList.emit(ttsList);
        this.asrModelList.emit(asrList);
      }
    );
  }

  async getVoiceFiles() {
    const query = `query SoundFile($type: String!) { getSoundFiles(type: $type) { id, filepath, filename, text, model_used, label } }`;
    this.graphqlService.sendQuery(query, { type: "asr" }).subscribe((data) => {
      const files: any[] = data?.data?.getSoundFiles || [];
      const ret = [{ value: "default", label: "Default" }];
      for (let i = 0; i < files.length; i++) {
        if (!files[i].label) continue;
        ret.push({ label: files[i].label, value: files[i].filepath });
      }
      this.voiceFiles.emit(ret);
    });
  }

  async uploadFile(files: any, callback: any = null) {
    this.socketService.uploadFile(
      files,
      "upload/workspace",
      this._activeConversation.id,
      "",
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

  async getOnlineSkills() {
    await this.socketService.send("command", {
      command: "get_online_skills",
    });
  }

  async getConversations(allyId: number = 0) {
    const query = `query ChatConversationsByAlly($ally_id: Int!) { getConversationByAlly(ally_id: $ally_id) { id, topic, is_private, is_shared, created_at, updated_at, seed, top_p, top_k, min_p, mirostat, mirostat_eta, mirostat_tau, temperature, system_message, use_model, router_config, first_message_id } }`;
    this.graphqlService
      .sendQuery(query, { ally_id: allyId })
      .subscribe((data) => {
        console.log(data);
        const conversations: Conversation[] = data.data.getConversationByAlly;
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
            ally_id: allyId,
            is_shared: conversation.is_shared,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
            temperature: conversation.temperature,
            seed: conversation.seed,
            system_message: conversation.system_message || "",
            first_message_id: conversation.first_message_id,
            top_k: conversation.top_k,
            top_p: conversation.top_p,
            min_p: conversation.min_p,
            mirostat: conversation.mirostat,
            mirostat_eta: conversation.mirostat_eta,
            mirostat_tau: conversation.mirostat_tau,
            use_model: conversation.use_model,
            router_config: routerConfig,
            icon: "",
            messages: [],
          });
        }
        this.conversationList.emit(list);
      });
  }

  resetConversation(
    activeAlly: DigitalAlly | null,
    resetWorkspace: boolean = true
  ) {
    const conv = JSON.parse(JSON.stringify(this.emptyConversation));
    if (activeAlly) {
      conv.ally_id = activeAlly.id;
      conv.top_k = activeAlly.top_k || conv.top_k;
      conv.top_p = activeAlly.top_p || conv.top_p;
      conv.min_p = activeAlly.min_p || conv.min_p;
      conv.use_model = activeAlly.use_model || conv.use_model;
      conv.mirostat = activeAlly.mirostat || conv.mirostat;
      conv.mirostat_tau = activeAlly.mirostat_tau || conv.mirostat_tau;
      conv.mirostat_eta = activeAlly.mirostat_eta || conv.mirostat_eta;
      conv.temperature = activeAlly.temperature || conv.temperature;
      conv.seed = activeAlly.seed || conv.seed;
      conv.router_config = activeAlly.router_config || conv.router_config;
      conv.system_message = activeAlly.system_message || conv.system_message;
      conv.first_message_id = 0;
    }
    this._activeConversation = conv;

    this.activeConversation.next(this._activeConversation);
    if (resetWorkspace) {
      this.socketService.send("command", {
        command: "reset_workspace",
        conversation_id: 0,
      });
    }
  }

  async deleteConversation(conversationId: number) {
    const query = `mutation Message($id: Int!) { deleteConversation(id: $id) { id } }`;
    this.graphqlService
      .sendQuery(query, { id: conversationId })
      .subscribe((data) => {});
  }

  async updateConversation(conversation: Conversation, allyId: number) {
    const query = `mutation Message($id: Int!, $topic: String!, $system_message: String!, $use_model: String!, $seed: Float!, $top_p: Float!, $top_k: Int!, $temperature: Float!, $router_config: String!, $min_p: Float!, $mirostat: Int!, $mirostat_eta: Float!, $mirostat_tau: Float!) { updateConversation(id: $id, topic: $topic, system_message: $system_message, use_model: $use_model, seed: $seed, top_p: $top_p, top_k: $top_k, temperature: $temperature, router_config: $router_config, mirostat: $mirostat, mirostat_tau: $mirostat_tau, mirostat_eta: $mirostat_eta, min_p: $min_p ) { id } }`;
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
        min_p: conversation.min_p,
        mirostat: conversation.mirostat,
        mirostat_tau: conversation.mirostat_tau,
        mirostat_eta: conversation.mirostat_eta,
        temperature: conversation.temperature,
        router_config: routerConfig,
      })
      .subscribe((data) => {
        this.getConversations(allyId);
      });
  }

  async deleteConversationMessage(messageId: number, callback?: Function) {
    const query = `mutation Message($id: Int!) { deleteConversationMessage(id: $id) { id } }`;
    this.graphqlService
      .sendQuery(query, { id: messageId })
      .subscribe((data) => {
        if (callback) callback(data);
      });
  }

  getBaseUrl(): string {
    return this.socketService.getBaseUrl();
  }

  async getConversationMessages(
    conversationId: number,
    firstMessageId: number
  ) {
    const query = `query Message($id: Int!) { getConversationMessages(conversation_id: $id) { id, icon, shortcuts, content, role, conversation_id, parent_id, active_child_id, num_children, created_at, files } }`;
    this.graphqlService
      .sendQuery(query, { id: conversationId })
      .subscribe((data) => {
        const messages = data?.data?.getConversationMessages || [];
        let parentMap: any = { 0: [] };
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          parentMap[message.id] = [];
          if (parentMap[message.parent_id])
            parentMap[message.parent_id].push(message.id);
        }

        const list: Message[] = [];
        let currentParentId = 0;
        let nextMessageId = 0;
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          if (currentParentId === 0) {
            if (message.id != firstMessageId) continue;
            currentParentId = message.id;
            nextMessageId = message.active_child_id;
          } else {
            if (message.id != nextMessageId) continue;
            currentParentId = message.id;
            nextMessageId = message.active_child_id;
          }

          const siblings = parentMap[message.parent_id] || [];
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
            siblings: siblings,
            raw: message.content,
            blocks: useBlocks,
            is_editing: false,
            files: message.files || "",
            filesList: message.files?.split(",") || [],
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

  switchMessageChain(
    messageId: number,
    parentId: number,
    conversationId: number
  ) {
    this.socketService.send("command", {
      command: "switch_message_chain",
      message_id: parentId,
      active_child_id: messageId,
      conversation_id: conversationId,
    });
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

  clipMessages(index: number) {
    const len = this._activeConversation.messages.length;
    this._activeConversation.messages.splice(index, len - index);
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
    payload.min_p = this._activeConversation.min_p;
    payload.mirostat = this._activeConversation.mirostat;
    payload.mirostat_tau = this._activeConversation.mirostat_tau;
    payload.mirostat_eta = this._activeConversation.mirostat_eta;
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

  getImageUrl(imagePath: string) {
    return this.socketService.getBaseUrl() + imagePath;
  }

  async getAvailableImages() {
    const query = `query { getGeneratedImage { id, prompt, negative_prompt, seed, height, width, guidance_scale, steps, image_url, created_at, model_name } }`;
    this.graphqlService.sendQuery(query, {}).subscribe((data) => {
      const images: GeneratedImage[] = data.data.getGeneratedImage;
      this.imageList.emit(images);
    });
  }

  getMirostatOptions() {
    return [
      {
        value: 0,
        label: "Off",
      },
      {
        value: 1,
        label: "v1",
      },
      {
        value: 2,
        label: "v2",
      },
    ];
  }

  async getDigitalAllies() {
    const query = `query { getDigitalAlly { id, user_id, system_message, use_model, seed, temperature, conversation_tone, top_k, top_p, min_p, mirostat, mirostat_eta, mirostat_tau, router_config, created_at, updated_at, name, wake_words, chat_round_limits, voice, location_image, character_image, short_description, tag_line, sort_order } }`;
    this.graphqlService.sendQuery(query, {}).subscribe((data) => {
      const digitalAllies: DigitalAlly[] = data.data.getDigitalAlly;
      const list: DigitalAlly[] = [];
      for (let i = 0; i < digitalAllies.length; i++) {
        const ally = digitalAllies[i];
        list.push({
          id: ally.id,
          sort_order: ally.sort_order,
          user_id: ally.user_id,
          system_message: ally.system_message || "",
          use_model: ally.use_model,
          seed: ally.seed,
          temperature: ally.temperature,
          top_k: ally.top_k,
          top_p: ally.top_p,
          min_p: ally.min_p,
          mirostat: ally.mirostat,
          mirostat_eta: ally.mirostat_eta,
          mirostat_tau: ally.mirostat_tau,
          router_config: ally.router_config,
          created_at: ally.created_at,
          updated_at: ally.updated_at,
          name: ally.name,
          wake_words: ally.wake_words,
          chat_round_limits: ally.chat_round_limits,
          voice: ally.voice,
          location_image: ally.location_image,
          character_image: ally.character_image,
          short_description: ally.short_description,
          tag_line: ally.tag_line,
          conversation_tone: ally.conversation_tone,
          loaded_tones: JSON.parse(ally.conversation_tone || "[]"),
        });
      }
      list.sort((a, b) => a.sort_order - b.sort_order);
      this.digitalAllies.emit(list);
    });
  }

  async deleteDigitalAlly(digitalAllyId: number, callback?: Function) {
    const query = `mutation DigitalAllyDelete($id: Int!) { deleteDigitalAlly(id: $id) { id } }`;
    this.graphqlService
      .sendQuery(query, { id: digitalAllyId })
      .subscribe((data) => {
        if (callback) callback(data);
      });
  }

  async updateDigitalAlly(digitalAlly: DigitalAlly, callback?: Function) {
    const query = `mutation DigitalAllyUpdate($id: Int!, $sort_order: Int, $system_message: String, $use_model: String, $seed: Float, $top_p: Float, $top_k: Int, $temperature: Float, $router_config: String, $min_p: Float, $mirostat: Int, $mirostat_eta: Float, $mirostat_tau: Float, $name: String, $wake_words: String, $chat_round_limits: Int, $voice: String, $location_image: String, $character_image: String, $short_description: String, $tag_line: String, $conversation_tone: String) { updateDigitalAlly(id: $id, sort_order: $sort_order, system_message: $system_message, use_model: $use_model, seed: $seed, top_p: $top_p, top_k: $top_k, temperature: $temperature, router_config: $router_config, min_p: $min_p, mirostat: $mirostat, mirostat_eta: $mirostat_eta, mirostat_tau: $mirostat_tau, name: $name, wake_words: $wake_words, chat_round_limits: $chat_round_limits, voice: $voice, location_image: $location_image, character_image: $character_image, short_description: $short_description, tag_line: $tag_line, conversation_tone: $conversation_tone) { id } }`;
    digitalAlly.seed = parseFloat("" + digitalAlly.seed);
    this.graphqlService
      .sendQuery(query, {
        id: digitalAlly.id,
        sort_order: digitalAlly.sort_order,
        system_message: digitalAlly.system_message,
        use_model: digitalAlly.use_model,
        seed: digitalAlly.seed,
        top_p: digitalAlly.top_p,
        top_k: digitalAlly.top_k,
        temperature: digitalAlly.temperature,
        router_config: digitalAlly.router_config,
        min_p: digitalAlly.min_p,
        mirostat: digitalAlly.mirostat,
        mirostat_eta: digitalAlly.mirostat_eta,
        mirostat_tau: digitalAlly.mirostat_tau,
        name: digitalAlly.name,
        wake_words: digitalAlly.wake_words,
        chat_round_limits: digitalAlly.chat_round_limits,
        voice: digitalAlly.voice,
        location_image: digitalAlly.location_image,
        character_image: digitalAlly.character_image,
        short_description: digitalAlly.short_description,
        tag_line: digitalAlly.tag_line,
        conversation_tone: digitalAlly.conversation_tone,
      })
      .subscribe((data) => {
        if (callback) return callback(data);
        //this.getDigitalAllies();
      });
  }
}
