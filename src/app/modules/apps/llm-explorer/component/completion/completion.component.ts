import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { ConfirmationService, Message, MessageService } from "primeng/api";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import { SavedSet } from "../../api/saved-set";
import { LlmExplorerService } from "../../service/llm-explorer.service";
import { ChatData } from "../../api/chat-data";

@Component({
  templateUrl: "./completion.component.html",
  styleUrls: ["../chat/chat.component.scss"],
  providers: [ConfirmationService, MessageService, LlmExplorerService],
})
export class CompletionComponent implements OnInit, OnDestroy {
  private onlineModelsSubscription!: Subscription;
  private outputSubscription!: Subscription;
  private outputFragmentSubscription!: Subscription;
  topK: number = 50;
  topP: number = 0.9;
  minP: number = 0.05;
  seed: number = -1;
  mirostat: number = 0;
  mirostatEta: number = 0.1;
  mirostatTau: number = 5;
  temperature: number = 1;
  completion: string = "";
  selectedModel!: string;
  modelOptions: any[] = [];
  maxNewTokens = 1024;
  isGenerating: boolean = false;
  generationModel!: string;

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

  constructor(
    private llmService: LlmExplorerService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnDestroy(): void {
    this.onlineModelsSubscription.unsubscribe();
    this.outputSubscription.unsubscribe();
    this.outputFragmentSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.outputSubscription = this.llmService.outputUpdate.subscribe(
      (update: any) => {
        this.isGenerating = false;
      }
    );

    this.outputFragmentSubscription =
      this.llmService.outputFragmentUpdate.subscribe((fragment: string) => {
        this.completion += fragment;
      });

    this.onlineModelsSubscription =
      this.llmService.onlineLanguageModels.subscribe(
        (models: ModelOptions[]) => {
          const slimList = [];
          for (let i = 0; i < models.length; i++) {
            if (!i) continue;
            if (models[i].value.startsWith("openai")) continue;
            slimList.push(models[i]);
          }
          this.modelOptions = slimList;
        }
      );
    this.llmService.getOnlineLanguageModels();
  }

  calculateRows(content: string): number {
    return this.llmService.calculateRows(content, 160);
  }

  async executeCompletion() {
    if (this.isGenerating) {
      this.llmService.stopGeneration(this.generationModel);
      return;
    }
    const payload: CompletionRequest = {
      top_k: this.topK,
      top_p: this.topP,
      min_p: this.minP,
      raw: this.completion,
      seed: this.seed,
      temperature: this.temperature,
      mirostat: this.mirostat,
      mirostat_eta: this.mirostatEta,
      mirostat_tau: this.mirostatTau,
      use_model: this.selectedModel,
      max_new_tokens: this.maxNewTokens,
    };
    this.isGenerating = true;
    this.generationModel = this.selectedModel;
    await this.llmService.executeCompletion(payload);
  }
}
