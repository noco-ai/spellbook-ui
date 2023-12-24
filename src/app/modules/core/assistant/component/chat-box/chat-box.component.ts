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
  ChangeDetectorRef,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import { Subscription } from "rxjs";
import { Message, Block } from "../../api/message";
import { Conversation } from "../../api/conversation";
import { AssistantService } from "../../service/assistant.service";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ConfirmationService, MessageService } from "primeng/api";
import emojiRegex from "emoji-regex";
import { ModelOptions } from "../../api/model-options";
import { SocketService } from "src/app/service/sockets.service";

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
  ];

  mirostatOptions = [
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

  @Input() conversation!: Conversation;
  @Input() maxHeight: string = "150px";
  @ViewChild("textarea") textarea: ElementRef | undefined;
  @ViewChild("conversationTopic") conversationTopic: ElementRef | undefined;

  constructor(
    private chatService: AssistantService,
    private sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService,
    private socketService: SocketService,
    private messageService: MessageService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes["conversation"]) {
      this.lastClipboardFile = 1;
    }
  }

  ngOnInit(): void {
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

    this.baseIconUrl = this.chatService.getSocketUrl();
    this.setMessage();
    this.messageSubscription = this.chatService.incomingMessage.subscribe(
      (message) => {
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
        this.canStopGeneration = false;
        this.canEdit = true;
        this.progressVisible = false;
        this.cursorInUse = false;
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
          this.addAiMessage(text, ["asset/spellbook/core/ai-icon.jpeg"], "");
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
    this.fragmentSubscription.unsubscribe();
    this.iconSubscription.unsubscribe();
    this.onlineModelsSubscription.unsubscribe();
    this.progressBarSubscription.unsubscribe();
    this.messageSubscription.unsubscribe();
    this.cursorSubscription.unsubscribe();
    this.toastUpdates.unsubscribe();
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
    this.chatService.updateConversation(this.conversation);
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
        this.chatService.deleteConversationMessages(message.id);
        this.conversation.messages.splice(
          this.conversation.messages.length - 2,
          2
        );
      },
      reject: () => {},
    });
  }

  /*cancelEdit(message: Message, div: any) {
    //let content = div.innerText;
    div.innerText = message.content;
    message.is_editing = false;
    this.canEdit = true;
  }

  startRegenerate(message: Message, div: any) {
    console.log(div.innerText);
    console.log(message);
  }*/

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
    });
  }

  showSidebar() {
    this.chatService.getConversations();
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
        this.chatService.resetConversation();
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

  sendMessage() {
    let message = this.textarea?.nativeElement.innerHTML.replace(
      /<br\s*\/?>/g,
      "\n"
    );

    const shortcuts = this.extractLeadingEmojis(message);
    message = message.slice(shortcuts.length);

    // build the payload to send to server
    const stream = true;
    let payload: {
      stream: boolean;
      messages: any[];
      content: string;
      shortcuts: string;
    } = {
      stream: stream,
      messages: [],
      content: message,
      shortcuts: shortcuts,
    };

    for (let i = 0; i < this.conversation.messages.length; i++) {
      const message: Message = this.conversation.messages[i];
      payload.messages.push({ role: message["role"], content: message["raw"] });
    }
    payload.messages.push({ role: "user", content: message });

    const filesList = this.uploadedFiles.join(",");
    let sendMessage = {
      id: 0,
      parent_id: 0,
      icon: ["asset/spellbook/core/user-avatar.png"],
      conversation_id: this.conversation.id,
      content: message,
      role: "user",
      shortcuts: "",
      created_at: new Date().getTime(),
      blocks: [],
      is_editing: false,
      raw: message,
      files: filesList,
      filesList: this.uploadedFiles,
    };

    this.chatService.sendMessage(sendMessage, payload);
    this.uploadedFiles = [];

    // clear the div
    if (this.textarea) {
      this.textarea.nativeElement.innerHTML = "";
    }
  }

  parseDate(timestamp: number) {
    let date = new Date(timestamp);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let day = date.getDate();
    let month = date.getMonth() + 1; // months are 0-based in JS
    let year = date.getFullYear();

    // Convert to 12-hour format
    let period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // If you want to add leading zeros:
    let hoursFormatted = hours < 10 ? "0" + hours : hours;
    let minutesFormatted = minutes < 10 ? "0" + minutes : minutes;
    let secondsFormatted = seconds < 10 ? "0" + seconds : seconds;
    let dayFormatted = day < 10 ? "0" + day : day;
    let monthFormatted = month < 10 ? "0" + month : month;

    // return as HH:MM:SS AM/PM, DD-MM-YYYY format
    return `${hoursFormatted}:${minutesFormatted}:${secondsFormatted} ${period}, ${dayFormatted}-${monthFormatted}-${year}`;
  }
}
