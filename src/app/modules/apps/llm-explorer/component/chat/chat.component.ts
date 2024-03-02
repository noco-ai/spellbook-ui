import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { ConfirmationService, Message, MessageService } from "primeng/api";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import { SavedSet } from "../../api/saved-set";
import { LlmExplorerService } from "../../service/llm-explorer.service";
import { ChatData } from "../../api/chat-data";

@Component({
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
  providers: [ConfirmationService, MessageService, LlmExplorerService],
})
export class ChatComponent implements OnInit, OnDestroy {
  private onlineModelsSubscription!: Subscription;
  private setsSubscription!: Subscription;
  private outputSubscription!: Subscription;
  private outputFragmentSubscription!: Subscription;
  currentId: number = 0;
  numExamples: number = 0;
  numExamplesPrev: number = 0;
  topK: number = 50;
  topP: number = 0.9;
  minP: number = 0.05;
  seed: number = -1;
  temperature: number = 1;
  mirostat: number = 0;
  mirostatEta: number = 0.1;
  mirostatTau: number = 5;
  maxNewTokens: number = 1024;
  uniqueKey: string = "";
  input: string = "";
  output: string = "";
  systemMessage: string = "";
  numGenerations: number | null = null;
  chatList: ChatData[] = [];
  showSaveChat: boolean = false;
  chatMap: Map<number, ChatData>;
  checkKeyRegex: RegExp = /^[a-z0-9_]+$/;
  modelOptions: ModelOptions[] = [];
  savedSets: SavedSet[] = [];
  selectedModels: string[] = [];
  numGenerationOptions: any[] = [];
  examplePairs: any[];
  chatOptions: any[] = [];
  shotOverride: number | null = null;
  modelMap: Map<string, string>;
  isGenerating: boolean = false;
  generationModel!: string;
  generationEscape: boolean = false;

  constructor(
    private llmService: LlmExplorerService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.chatMap = new Map();
    this.modelMap = new Map();
    this.examplePairs = Array(this.numExamples).fill({
      user: "",
      assistant: "",
    });
    this.selectedModels = [];
    this.shotOverride = null;

    this.numGenerationOptions = Array(5)
      .fill(null)
      .map((_, i) => ({ value: i + 2, label: i + 2 }));
  }

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

  addExample() {
    this.numExamples++;
    this.updateNumExamples();
  }

  removeExample() {
    this.numExamples--;
    this.updateNumExamples();
  }

  copyExample($event: Event, i: number) {
    $event.preventDefault();
    this.input = this.examplePairs[i].user;
    this.output = "";
    return;
  }

  calculateRows(content: string): number {
    return this.llmService.calculateRows(content);
  }

  copyOutputToClipboard($event: Event) {
    $event.preventDefault();
    navigator.clipboard.writeText(this.output);
  }

  updateNumExamples() {
    const oldExamples = JSON.parse(JSON.stringify(this.examplePairs));
    this.examplePairs = [];
    for (let i = 0; i < this.numExamples; i++) {
      this.examplePairs[i] = !oldExamples[i]
        ? { user: "", assistant: "" }
        : oldExamples[i];
    }

    if (this.numExamples == this.numExamplesPrev + 1) {
      this.examplePairs[this.examplePairs.length - 1] = {
        user: this.input,
        assistant: this.output,
      };
      this.input = "";
      this.output = "";
    }
    this.numExamplesPrev = this.numExamples;
  }

  validateExamplePairs(): boolean {
    for (let i = 0; i < this.examplePairs.length; i++) {
      if (
        !this.examplePairs[i].user.length ||
        !this.examplePairs[i].assistant.length
      )
        return false;
    }
    return true;
  }

  async executeChat() {
    if (this.isGenerating) {
      this.generationEscape = true;
      this.llmService.stopGeneration(this.generationModel);
      return;
    }

    this.generationEscape = false;
    const uniqueKey = !this.uniqueKey.length ? "working_copy" : this.uniqueKey;
    if (!this.validateExamplePairs()) {
      this.messageService.add({
        summary: `Error generating output`,
        detail: `Multi-shot examples are not all filled in.`,
        severity: "error",
      });
      return;
    }

    if (!this.input.length) {
      this.messageService.add({
        summary: `Error generating output`,
        detail: `Input is not filled in.`,
        severity: "error",
      });
      return;
    }

    this.saveChat(
      true,
      async () => {
        this.isGenerating = true;
        this.output = "";

        for (let i = 0; i < this.selectedModels.length; i++) {
          let numGenerations = this.numGenerations || 1;
          for (let j = 0; j < numGenerations; j++) {
            if (j == 0)
              this.output += this.modelMap.get(this.selectedModels[i]) + "\n";
            if (j == 0 && numGenerations > 1) this.output += "\n";
            if (numGenerations > 1) this.output += `Generation #${j + 1}\n`;

            this.generationModel = this.selectedModels[i];
            await this.llmService.executeChat(
              this.input,
              uniqueKey,
              this.selectedModels[i],
              this.maxNewTokens
            );

            if (this.generationEscape) break;
            this.output += "\n";
          }
          if (this.generationEscape) break;
        }
        this.isGenerating = false;
      },
      uniqueKey
    );
  }

  deleteChat() {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete this multi-shot example set?`,
      icon: `pi pr-trash`,
      accept: async () => {
        await this.llmService.deleteChat(this.currentId);
        this.messageService.add({
          summary: `Deleted`,
          detail: "The multi-shot example set has been deleted",
          severity: "info",
        });
        this.clearChat();
        this.llmService.getChats();
      },
      reject: () => {},
    });
  }

  clearChat() {
    this.output = "";
    this.uniqueKey = "";
    this.systemMessage = "";
    this.topK = 50;
    this.topP = 0.9;
    this.minP = 0.05;
    this.mirostat = 0;
    this.mirostatEta = 0.1;
    this.mirostatTau = 5;
    this.temperature = 1;
    this.currentId = 0;
    this.examplePairs = Array(this.numExamples).fill({
      user: "",
      assistant: "",
    });
  }

  updateChat() {
    const newChat: ChatData | undefined = this.chatMap.get(this.currentId);
    if (!newChat) return;
    this.uniqueKey = newChat.unique_key;
    this.systemMessage = newChat.system_message;
    this.topK = newChat.top_k;
    this.topP = newChat.top_p;
    this.minP = newChat.min_p;
    this.mirostat = newChat.mirostat;
    this.mirostatEta = newChat.mirostat_eta;
    this.mirostatTau = newChat.mirostat_tau;
    this.seed = newChat.seed;
    this.temperature = newChat.temperature;
    const examplePairs = JSON.parse(newChat.examples);

    for (let i = 0; i < examplePairs.length; i++) {
      if (examplePairs[i].exclude === "true") {
        examplePairs[i].exclude = [i];
      } else {
        delete examplePairs[i].exclude;
      }
    }
    this.examplePairs = examplePairs;
    this.numExamples = this.examplePairs.length;
    this.numExamplesPrev = this.examplePairs.length;
  }

  showSave() {
    this.showSaveChat = true;
  }

  saveChat(
    skipCheck: boolean = false,
    callback: Function | undefined = undefined,
    uniqueKey: string = "working_copy"
  ) {
    let error = "";

    if (!skipCheck) {
      if (!uniqueKey.length) {
        error = "Please enter a valid unique key.";
      } else if (!this.validateExamplePairs()) {
        error = "All example pairs must have text in them to save.";
      }

      if (error.length) {
        this.messageService.add({
          summary: `Error saving multi-shot`,
          detail: error,
          severity: "error",
        });
        return;
      }
    }

    this.showSaveChat = false;
    const payload: ChatData = {
      temperature: this.temperature,
      top_k: this.topK,
      top_p: this.topP,
      min_p: this.minP,
      seed: parseInt("" + this.seed),
      mirostat: this.mirostat,
      mirostat_eta: this.mirostatEta,
      mirostat_tau: this.mirostatTau,
      system_message: this.systemMessage,
      examples: JSON.stringify(this.examplePairs),
      unique_key: uniqueKey,
    };
    this.llmService.updateChat(payload, (chatUpd: number) => {
      this.currentId = chatUpd;
      if (callback) callback(chatUpd);
      return;
    });

    if (skipCheck) return;
    this.messageService.add({
      summary: `Saved`,
      detail: "Saved multi-shot example set to database.",
      severity: "info",
    });
  }

  ngOnDestroy(): void {
    this.onlineModelsSubscription.unsubscribe();
    this.setsSubscription.unsubscribe();
    this.outputSubscription.unsubscribe();
    this.outputFragmentSubscription.unsubscribe();
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.ctrlKey && event.shiftKey && event.key === 'V') {
      this.copyPayload();
    }
  }

  copyPayload() {
    const messagePairs = [];
    for (let i = 0; i < this.examplePairs.length; i++) {
      if (this.examplePairs[i].exclude === "true") continue;
      messagePairs.push({ role: "user", content: this.examplePairs[i].user });
      messagePairs.push({
        role: "assistant",
        content: this.examplePairs[i].assistant,
      });
    }
    const messages = [
      { role: "system", content: this.systemMessage },
      ...messagePairs
    ];

    const payload = {
      temperature: this.temperature,
      top_k: this.topK,
      top_p: this.topP,
      min_p: this.minP,
      seed: Number(this.seed),
      mirostat: this.mirostat,
      mirostat_eta: this.mirostatEta,
      mirostat_tau: this.mirostatTau,
      start_response: "",
      stream: false,
      debug: true,
      messages: messages
    };

    const json = JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(json);
  }

  ngOnInit(): void {
    document.addEventListener('keydown', this.handleKeyPress.bind(this));

    this.onlineModelsSubscription =
      this.llmService.onlineLanguageModels.subscribe(
        (models: ModelOptions[]) => {
          const stripNone: ModelOptions[] = models.splice(1);
          this.modelOptions = stripNone;
          this.modelMap.clear();
          for (let i = 0; i < this.modelOptions.length; i++) {
            const currentModel = this.modelOptions[i];
            this.modelMap.set(currentModel.value, currentModel.label);
          }
        }
      );

    this.outputSubscription = this.llmService.outputUpdate.subscribe(
      (data: any) => {
        this.output = this.output.trim();
        this.output += `\nTokens per second: ${data.tokens_per_second}\nCompletion Tokens: ${data.completion_tokens}\nPrompt Tokens: ${data.prompt_tokens}\n`;
      }
    );

    this.outputFragmentSubscription =
      this.llmService.outputFragmentUpdate.subscribe((fragment: string) => {
        this.output += fragment;
      });

    this.setsSubscription = this.llmService.chatList.subscribe(
      (list: ChatData[]) => {
        const ddOptions = [];
        this.chatList = list;
        this.chatMap.clear();
        for (let i = 0; i < list.length; i++) {
          if (list[i].unique_key == "working_copy") continue;
          ddOptions.push({
            label: list[i].unique_key,
            value: list[i].id,
          });
          this.chatMap.set(list[i].id || 0, list[i]);
        }
        this.chatOptions = ddOptions;
      }
    );

    this.llmService.getChats();
    this.llmService.getOnlineLanguageModels();
  }
}
