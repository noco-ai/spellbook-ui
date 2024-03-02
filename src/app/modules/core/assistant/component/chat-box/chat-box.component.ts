import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  SimpleChanges,
  OnChanges,
  NgZone,
} from "@angular/core";
import { Subscription } from "rxjs";
import { Message } from "../../api/message";
import { Conversation } from "../../api/conversation";
import { AssistantService } from "../../service/assistant.service";
import { DomSanitizer } from "@angular/platform-browser";
import { ConfirmationService, MessageService } from "primeng/api";
import emojiRegex from "emoji-regex";
import { ModelOptions } from "../../api/model-options";
import { SocketService } from "src/app/service/sockets.service";
import { SoundService } from "src/app/service/sound.service";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import { DigitalAlly } from "../../api/digital-allies";
import WaveSurfer from "wavesurfer.js";

@Component({
  selector: "app-chat-box",
  templateUrl: "./chat-box.component.html",
  styleUrls: ["./chat-box.component.scss"],
  providers: [ConfirmationService],
})
export class ChatBoxComponent
  implements OnInit, OnDestroy, AfterViewChecked, OnChanges
{
  @Output() sidebarVisibilityChange: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  private toastUpdates!: Subscription;
  private fragmentSubscription!: Subscription;
  private iconSubscription!: Subscription;
  private onlineModelsSubscription!: Subscription;
  private progressBarSubscription!: Subscription;
  private messageSubscription!: Subscription;
  private cursorSubscription!: Subscription;
  private asrModelsSubscription!: Subscription;
  private ttsModelsSubscription!: Subscription;
  private asrSubscription!: Subscription;
  private ttsSubscription!: Subscription;
  private messagesSubscription!: Subscription;

  asrOnReload: boolean = false;
  lastWasRegenerate: boolean = false;
  asrModels: ModelOptions[] = [];
  showGenerationSettings: boolean = false;
  canEdit: boolean = true;
  canStopGeneration: boolean = false;
  message!: Message;
  uploadedFiles: string[] = [];
  baseIconUrl!: string;
  counter: number = 0;
  progressValue: number = 0;
  progressVisible: boolean = false;
  progressLabel: string = "";
  lastProgressPercent: number = 0;
  showEditConversationDialog: boolean = false;
  cursorInUse: boolean = false;
  cursorTail: string = "";
  cursorLocation: number = 0;
  lastClipboardFile: number = 1;
  modelOptions: ModelOptions[] = [];
  routerConfigOptions: any[] = [
    {
      label: "Function Calling Enabled",
      value: "function_calling",
    },
    {
      label: "Model Routing Enabled",
      value: "model_routing",
    },
    {
      label: "Pin Manually Selected Functions",
      value: "pin_functions",
    },
    {
      label: "Pin Manually Selected Models",
      value: "pin_models",
    },
    {
      label: "🔉 Auto submit microphone input",
      value: "auto_asr",
    },
    {
      label: "🔉 Use xTTS to vocalize model response",
      value: "auto_tts",
    },
    {
      label: "🔉 Switch allies on wake work detection",
      value: "wake_words",
    },
    /*{
      label: "Fact check model response using internet",
      value: "fact_check",
    },
    {
      label: "Auto label conversation",
      value: "name_conversation",
    },*/
  ];

  mirostatOptions = this.chatService.getMirostatOptions();

  @Input() conversation!: Conversation;
  @Input() ally!: DigitalAlly;
  @Input() wakeWords!: string[];
  @Input() maxHeight: string = "150px";
  @ViewChild("textarea") textarea: ElementRef | undefined;
  @ViewChild("conversationTopic") conversationTopic: ElementRef | undefined;

  constructor(
    private chatService: AssistantService,
    private sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService,
    private socketService: SocketService,
    private messageService: MessageService,
    private soundService: SoundService,
    private zone: NgZone
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes["conversation"]) {
      this.lastClipboardFile = 1;
    }

    if (changes["ally"]) {
      var background = document.getElementById("background");
      if (
        background &&
        this.ally &&
        this.ally.location_image !=
          "asset/spellbook/core/location-placeholder.jpeg"
      ) {
        background.style.backgroundImage = `url('${this.socketService.getBaseUrl()}${
          this.ally.location_image
        }')`;
        background.style.backgroundSize = "cover";
        background.style.backgroundRepeat = "no-repeat";
        background.style.filter = "blur(5px)";
        background.style.position = "fixed";
        background.style.top = "0px";
        background.style.left = "0px";
        background.style.width = "100%";
        background.style.height = "100%";
        background.style.zIndex = "-1";
      }

      if (this.asrOnReload) {
        this.asrOnReload = false;
        this.sendMessage();
      }

      if (
        !this.conversation.id &&
        (!this.conversation.ally_id ||
          this.conversation.ally_id != this.ally.id)
      )
        this.chatService.resetConversation(this.ally, false);
    }
  }

  record?: any;
  wavesurfer?: any;
  wavesurferPlayback?: any;
  isRecording: boolean = false;
  isPlaying: boolean = false;
  playbackQueue: string[] = [];
  micOptions: any[] = [];
  useMicrophone: string = "";
  async startRecord() {
    this.zone.runOutsideAngular(async () => {
      if (this.isRecording) {
        this.record.stopMic();
        this.record.stopRecording();
        this.isRecording = false;
        return;
      }

      this.isRecording = true;
      await this.soundService.startRecording(this.record, this.useMicrophone);
    });
  }

  async ngOnInit(): Promise<void> {
    this.baseIconUrl = this.chatService.getSocketUrl();
    this.wavesurferPlayback = WaveSurfer.create({
      container: `#chatplayback`,
    });

    this.wavesurferPlayback.empty();
    this.wavesurferPlayback.on("finish", async () => {
      this.playbackQueue.splice(0, 1);
      if (this.playbackQueue.length) {
        this.wavesurferPlayback.empty();
        await this.wavesurferPlayback.load(this.playbackQueue[0]);
        this.wavesurferPlayback.playPause();
      } else {
        this.isPlaying = false;
      }
    });

    RecordPlugin.getAvailableAudioDevices().then((devices) => {
      devices.forEach((device) => {
        if (device.kind == "audioinput") {
          this.micOptions.push({ label: device.label, value: device.deviceId });
          if (!this.useMicrophone.length) this.useMicrophone = device.deviceId;
        }
      });
    });

    this.asrSubscription = this.soundService.asrProcessingFinished.subscribe(
      (data) => {
        this.isRecording = false;
        if (this.textarea) this.textarea.nativeElement.innerHTML = data.text;

        if (
          this.wakeWords?.length &&
          this.conversation.router_config?.includes("wake_words")
        ) {
          const upper = data.text.toUpperCase();
          for (let i = 0; i < this.wakeWords.length; i++) {
            const split = this.wakeWords[i].split(":");
            const index = upper.indexOf(split[0]);
            if (index !== -1 && (index <= 48 || index >= upper.length - 48)) {
              window.location.href = `#/ai-assistant/${split[1]}`;
              this.asrOnReload = this.conversation.router_config?.includes(
                "auto_asr"
              )
                ? true
                : false;
              return;
            }
          }
        }

        if (this.conversation.router_config?.includes("auto_asr"))
          this.sendMessage();
      }
    );

    this.ttsSubscription = this.soundService.ttsProcessingFinished.subscribe(
      async (data) => {
        this.playbackQueue.push(data.wav_url);
        if (!this.isPlaying) {
          this.wavesurferPlayback.empty();
          await this.wavesurferPlayback.load(data.wav_url);
          this.wavesurferPlayback.playPause();
          this.isPlaying = true;
        }
      }
    );

    // @ts-ignore
    hljs.configure({ ignoreUnescapedHTML: true });

    // is this first time loading the app on this device?
    const isFirst = localStorage.getItem("first_load");
    if (!isFirst) {
      window.location.href = "/#/app-manager/applications";
      localStorage.setItem("first_load", "true");
    }

    this.toastUpdates = this.socketService.onToastMessage.subscribe(
      (toastData: any) => {
        this.messageService.add(toastData);
      }
    );

    this.chatService.getOnlineLanguageModels();
    this.onlineModelsSubscription =
      this.chatService.onlineLanguageModels.subscribe(
        (models: ModelOptions[]) => {
          this.modelOptions = models;
        }
      );

    // get other online skills related to chat
    this.asrModelsSubscription = this.chatService.asrModelList.subscribe(
      async (modelList: ModelOptions[]) => {
        this.asrModels = modelList || [];
        if (this.asrModels.length && this.micOptions.length) {
          this.zone.runOutsideAngular(async () => {
            const instance =
              await this.soundService.createWavesurferRecordingInstance(
                "#chatrecord",
                132
              );

            this.record = instance.record;
            this.wavesurfer = instance.wavesurfer;

            this.record.on("record-end", async (blob: any) => {
              const recordedUrl = URL.createObjectURL(blob);
              const fileType = blob.type.split(";")[0].split("/")[1] || "webm";
              fetch(recordedUrl)
                .then((response) => response.blob())
                .then((blob) => {
                  this.soundService.sendAsrToServer(blob, fileType);
                });
            });
          });
        }
      }
    );

    this.messagesSubscription = this.chatService.conversationMessages.subscribe(
      (messages: Message[]) => (this.conversation.messages = messages)
    );

    this.ttsModelsSubscription = this.chatService.ttsModelList.subscribe(
      (modelList: ModelOptions) => {
        console.log(modelList);
      }
    );
    this.chatService.getOnlineSkills();

    this.progressBarSubscription = this.chatService.progressBarUpdate.subscribe(
      (data) => {
        const percent = (data.current / data.total) * 100;
        if (!this.progressVisible) {
          this.progressLabel = data.label;
          this.progressVisible = true;
        }

        // handle when we want indeterminate
        if (data.current === -1) {
          this.progressValue = -1;
          return;
        }

        if (percent - this.lastProgressPercent >= 3) {
          this.progressValue = Math.floor(percent);
          this.lastProgressPercent = percent;
          this.progressLabel = data.label;
        }
        if (data.current >= data.total) {
          this.progressVisible = false;
          this.progressValue = 0;
          this.lastProgressPercent = 0;
        }
      }
    );

    this.setMessage();
    this.messageSubscription = this.chatService.incomingMessage.subscribe(
      (message: any) => {
        if (message.content === "<stop>") {
          const lastMessageIndex = this.conversation.messages.length - 1;
          const lastUserMessageIndex = lastMessageIndex - 1;
          const lastMessage = this.conversation.messages[lastMessageIndex];

          this.conversation.messages[lastUserMessageIndex].id =
            message.parent_id;
          this.conversation.messages[lastMessageIndex].id = message.id;
          this.conversation.messages[lastMessageIndex].parent_id =
            message.parent_id;
          this.conversation.messages[lastMessageIndex].conversation_id =
            message.conversation_id;

          if (message.files && message.files.length) {
            const filesList = message.files.split(",");
            this.conversation.messages[lastUserMessageIndex].filesList =
              filesList;
            this.conversation.messages[lastUserMessageIndex].files =
              message.files;
          }

          const blocks = this.chatService.parseMarkdownBlocks(lastMessage.raw);
          this.conversation.messages[lastMessageIndex].blocks = blocks;
          this.conversation.messages[lastMessageIndex].content = "";
        } else {
          const lastMessage =
            this.conversation.messages[this.conversation.messages.length - 1];

          if (lastMessage.role === "assistant") {
            this.conversation.messages.pop();
          }
          const blocks = this.chatService.parseMarkdownBlocks(message.content);
          message.blocks = blocks;
          message.content = "";
          this.conversation.messages.push(message);
        }
        if (this.lastWasRegenerate)
          this.chatService.getConversationMessages(
            this.conversation.id,
            this.conversation.messages[0].id
          );

        if (message.generated_files && message.generated_files.length) {
          const lastMessageIndex = this.conversation.messages.length - 1;
          this.conversation.messages[lastMessageIndex].filesList =
            message.generated_files;
          this.conversation.messages[lastMessageIndex].files =
            message.generated_files.join(",");
        }

        localStorage.setItem(
          `last-conversation-${this.ally?.id || 0}`,
          "" + this.conversation.id
        );

        if (
          this.conversation.router_config?.includes("auto_tts") &&
          !message.generated_files.length
        ) {
          const lastMessageIndex = this.conversation.messages.length - 1;
          const text = this.conversation.messages[lastMessageIndex].raw;
          this.soundService.sendTtsToServer(
            text,
            this.ally?.voice || "default"
          );
        }
        this.canStopGeneration = false;
        this.canEdit = true;
        this.progressVisible = false;
        this.lastWasRegenerate = false;
        this.cursorInUse = false;
        this.progressValue = 0;
        this.lastProgressPercent = 0;
      }
    );

    this.iconSubscription = this.chatService.updateIcons.subscribe(
      (iconData: any) => {
        const lastMessage = this.conversation.messages.length - 1;
        if (
          lastMessage == -1 ||
          this.conversation.messages[lastMessage].role !== "assistant"
        ) {
          if (
            lastMessage >= 0 &&
            this.conversation.messages[lastMessage].role === "user"
          ) {
            this.conversation.messages[lastMessage].shortcuts =
              iconData.user_shortcuts;
          }
          this.addAiMessage("", iconData.icons, iconData.shortcuts);
        } else {
          this.conversation.messages[lastMessage].icon = iconData.icons;
          this.conversation.messages[lastMessage].shortcuts =
            iconData.shortcuts;
          this.conversation.messages[lastMessage - 1].shortcuts =
            iconData.user_shortcuts;
        }
      }
    );

    this.cursorSubscription = this.chatService.updateCursor.subscribe(
      (data) => {
        const lastMessage = this.conversation.messages.length - 1;
        if (
          lastMessage == -1 ||
          this.conversation.messages[lastMessage].role !== "assistant"
        ) {
          return;
        }
        this.cursorInUse = !data.index ? false : true;
        this.cursorLocation = data.index;
        this.cursorTail = data.tail;
      }
    );

    this.fragmentSubscription = this.chatService.incomingFragment.subscribe(
      (text) => {
        if (this.canEdit) this.canEdit = false;
        if (!this.canStopGeneration) this.canStopGeneration = true;
        const lastMessage = this.conversation.messages.length - 1;
        if (
          lastMessage == -1 ||
          this.conversation.messages[lastMessage].role !== "assistant"
        ) {
          this.addAiMessage(
            text,
            [this.ally?.character_image || "asset/spellbook/core/ai-icon.jpeg"],
            ""
          );
        } else {
          const appendTo = this.conversation.messages[lastMessage];
          if (this.cursorInUse) {
            let adjustText = appendTo.raw.substring(
              0,
              appendTo.raw.length - this.cursorLocation
            );
            adjustText += text;
            adjustText += this.cursorTail;
            appendTo.raw = adjustText;
          } else {
            appendTo.raw += text;
          }
          appendTo.content = "";
          appendTo.blocks = this.chatService.parseMarkdownBlocks(appendTo.raw);
        }
      }
    );
  }

  ngOnDestroy() {
    this.messagesSubscription.unsubscribe();
    this.fragmentSubscription.unsubscribe();
    this.iconSubscription.unsubscribe();
    this.onlineModelsSubscription.unsubscribe();
    this.progressBarSubscription.unsubscribe();
    this.messageSubscription.unsubscribe();
    this.cursorSubscription.unsubscribe();
    this.toastUpdates.unsubscribe();
    this.asrModelsSubscription.unsubscribe();
    this.ttsModelsSubscription.unsubscribe();
    this.asrSubscription.unsubscribe();
    this.ttsSubscription.unsubscribe();
    this.chatService.resetConversation(null, false);
    if (this.record) {
      this.zone.runOutsideAngular(async () => {
        this.record.destroy();
        this.wavesurfer.destroy();
      });
    }
  }

  onDragOver(event: Event) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    this.chatService.uploadFile(files, (data: any) => {
      if (!data.error) {
        this.uploadedFiles.push(data.file);
      }
    });
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    // Get the plain text from the clipboard
    const text = event.clipboardData?.getData("text/plain") ?? "";
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    const items = event.clipboardData?.items;
    if (items == undefined) {
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          let filename = `clipboard-${
            this.lastClipboardFile < 10
              ? "0" + this.lastClipboardFile
              : this.lastClipboardFile
          }.png`;
          const file = new File([blob], filename, {
            type: blob.type,
          });
          const dt = new DataTransfer();
          dt.items.add(file);
          const files = dt.files;

          this.chatService.uploadFile(files, (data: any) => {
            if (!data.error) {
              this.lastClipboardFile++;
              this.uploadedFiles.push(data.file);
            }
          });
        }
      }
    }
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (this.canEdit) {
        this.sendMessage();
        this.canEdit = false;
      }
      this.adjustHeight(event);
    }
  }

  stopGeneration() {
    this.chatService.stopGeneration();
  }

  editConversation(conversation: Conversation) {
    this.showGenerationSettings = false;
    this.showEditConversationDialog = true;
  }

  submitEditConversation() {
    this.showEditConversationDialog = false;
    this.conversation.topic = this.conversationTopic?.nativeElement.value;
    if (!this.conversation.id) return;
    this.chatService.updateConversation(this.conversation, this.ally?.id || 0);
  }

  adjustHeight(event: any) {
    const textareaNativeElement = this.textarea?.nativeElement;
    textareaNativeElement.style.height = "auto";
    let height =
      textareaNativeElement.scrollHeight > this.maxHeight
        ? this.maxHeight
        : textareaNativeElement.scrollHeight;
    height = height < 44 ? 44 : height;
    textareaNativeElement.style.height = `${height}px`;
  }

  setMessage() {
    if (this.conversation) {
      let filteredMessages = this.conversation.messages.filter(
        (m: any) => m.role !== "user"
      );
      this.message = filteredMessages[filteredMessages.length - 1];
    }
  }

  async playGeneratedSound(soundFile: string) {
    const url = this.chatService.getBaseUrl() + soundFile;
    await this.wavesurferPlayback.load(url);
    this.wavesurferPlayback.playPause();
    this.isPlaying = true;
  }

  async stopGeneratedSound() {
    if (!this.isPlaying) return;
    this.wavesurferPlayback.playPause();
  }

  ngAfterViewChecked() {
    // @ts-ignore
    hljs.highlightAll();
    var codeElements = document.querySelectorAll(
      "pre > code.language-nohighlight"
    );
    codeElements.forEach(function (codeElement) {
      if (!codeElement || !codeElement.parentElement) return;
      codeElement.parentElement.classList.add("has-nohighlight");
    });
  }

  copyToClipboard(content: string) {
    navigator.clipboard.writeText(content);
  }

  startEdit(message: Message, div: any) {
    if (!this.canEdit) {
      return;
    }
    this.canEdit = false;
    message.is_editing = true;
  }

  deleteMessage(event: Event, message: Message) {
    if (!this.canEdit) {
      return;
    }

    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event.target || new EventTarget(),
      message:
        "Are you sure that you want to delete this message and it's response?",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.chatService.deleteConversationMessage(message.id, () => {
          this.chatService.getConversationMessages(
            this.conversation.id,
            this.conversation.first_message_id
          );
        });
      },
      reject: () => {},
    });
  }

  cancelEdit(message: Message, div: any) {
    div.innerText = message.content;
    message.is_editing = false;
    this.canEdit = true;
  }

  startRegenerate(message: Message, div: any, index: number) {
    let content = div.innerText.replace(/<br\s*\/?>/g, "\n");
    this.chatService.clipMessages(index);
    const sendMessage = this.prepUserMessage(content);
    const payload = this.prepMessagePayload(content);
    this.lastWasRegenerate = true;
    this.chatService.sendMessage(sendMessage, payload);
  }

  private addAiMessage(text: string, icons: string[], shortcuts: string) {
    this.conversation.messages.push({
      id: 0,
      parent_id: 0,
      icon: icons,
      conversation_id: 0,
      content: text,
      role: "assistant",
      shortcuts: shortcuts,
      created_at: new Date().getTime(),
      blocks: [],
      is_editing: false,
      raw: text,
      files: "",
      filesList: [],
      siblings: [],
    });
  }

  showSidebar() {
    this.chatService.getConversations(this.ally?.id || undefined);
    this.sidebarVisibilityChange.emit(true);
  }

  allowHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  deleteConversation(event: Event, conversationId: number) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event.target || new EventTarget(),
      message: "Are you sure that you want to delete this conversation?",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.chatService.deleteConversation(conversationId);
        this.chatService.resetConversation(this.ally);
        window.localStorage.removeItem(
          `last-conversation-${this.ally?.id || 0}`
        );
        this.lastClipboardFile = 1;
      },
      reject: () => {},
    });
  }

  extractLeadingEmojis(s: string): string {
    const regex = emojiRegex();
    let match = regex.exec(s);
    let result = "";
    let lastIndex = 0;

    while (match && match.index === lastIndex) {
      result += match[0];
      lastIndex = match.index + match[0].length;
      match = regex.exec(s);
    }
    return result;
  }

  private prepUserMessage(messageContent: string) {
    const filesList = this.uploadedFiles.join(",");
    let sendMessage = {
      id: 0,
      parent_id: 0,
      icon: ["asset/spellbook/core/user-avatar.png"],
      conversation_id: this.conversation.id,
      content: messageContent,
      role: "user",
      shortcuts: "",
      created_at: new Date().getTime(),
      blocks: [],
      is_editing: false,
      raw: messageContent,
      files: filesList,
      filesList: this.uploadedFiles,
      siblings: [],
    };
    return sendMessage;
  }

  private findLongestCommonStartingString(messages: Message[]) {
    if (!messages || messages.length < 2) return "";
    let commonPrefix = messages[1].content;

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role == "user") continue;
      let currentString = messages[i].content;
      for (let j = 0; j < commonPrefix.length; j++) {
        if (j >= currentString.length || commonPrefix[j] !== currentString[j]) {
          commonPrefix = commonPrefix.substring(0, j);
          break;
        }
      }
    }
    return commonPrefix;
  }

  private prepMessagePayload(messageContent: string) {
    const shortcuts = this.extractLeadingEmojis(messageContent);
    messageContent = messageContent.slice(shortcuts.length);

    // build the payload to send to server
    const stream = true;
    let payload: {
      stream: boolean;
      start_response: string;
      messages: any[];
      ai_icon: string;
      content: string;
      shortcuts: string;
      ally_id: number;
    } = {
      stream: stream,
      messages: [],
      content: messageContent,
      shortcuts: shortcuts,
      start_response: "",
      ally_id: this.ally?.id || 0,
      ai_icon:
        this.ally?.character_image || "asset/spellbook/core/ai-icon.jpeg",
    };

    const numPrimers = this.ally?.loaded_tones?.length || 0;
    const primers = this.ally?.loaded_tones || [];
    if (numPrimers && this.conversation.messages.length / 2 < numPrimers) {
      const usePrimers = numPrimers - this.conversation.messages.length / 2;
      for (let i = 0; i < usePrimers; i++) {
        if (!primers[i].user.length || !primers[i].assistant.length) continue;
        payload.messages.push({ role: "user", content: primers[i].user });
        payload.messages.push({
          role: "assistant",
          content: primers[i].assistant,
        });
      }
    }

    for (let i = 0; i < this.conversation.messages.length; i++) {
      const message: Message = this.conversation.messages[i];
      payload.messages.push({ role: message["role"], content: message["raw"] });
    }

    if (this.ally && numPrimers) {
      const startResponse = this.findLongestCommonStartingString(
        payload.messages
      );
      payload.start_response = startResponse;
    }

    payload.messages.push({ role: "user", content: messageContent });
    return payload;
  }

  navigateToSibling(
    currentMessageId: number,
    parentId: number,
    siblings: number[],
    direction: "next" | "previous"
  ): void {
    const currentIndex = siblings.indexOf(currentMessageId);
    let targetIndex;

    if (direction === "next") {
      targetIndex = currentIndex + 1;
      if (targetIndex >= siblings.length) targetIndex = 0;
    } else {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) targetIndex = siblings.length - 1;
    }

    if (targetIndex >= 0 && targetIndex < siblings.length) {
      const targetId = siblings[targetIndex];
      this.chatService.switchMessageChain(
        targetId,
        parentId,
        this.conversation.id
      );
      if (parentId == 0) this.conversation.first_message_id = targetId;
    }
  }

  getCurrentPosition(messageId: number, siblings: number[]): number {
    const index = siblings.indexOf(messageId);
    return index >= 0 ? index + 1 : -1;
  }

  sendMessage() {
    let message = this.textarea?.nativeElement.innerHTML.replace(
      /<br\s*\/?>/g,
      "\n"
    );

    const sendMessage = this.prepUserMessage(message);
    const payload = this.prepMessagePayload(message);
    this.chatService.sendMessage(sendMessage, payload);
    this.uploadedFiles = [];
    if (this.textarea) this.textarea.nativeElement.innerHTML = "";
  }

  parseDate(timestamp: number) {
    let date = new Date(timestamp);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    let hoursFormatted = hours < 10 ? "0" + hours : hours;
    let minutesFormatted = minutes < 10 ? "0" + minutes : minutes;
    let secondsFormatted = seconds < 10 ? "0" + seconds : seconds;
    let dayFormatted = day < 10 ? "0" + day : day;
    let monthFormatted = month < 10 ? "0" + month : month;
    return `${hoursFormatted}:${minutesFormatted}:${secondsFormatted} ${period}, ${dayFormatted}-${monthFormatted}-${year}`;
  }
}
