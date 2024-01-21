import {
  Component,
  OnDestroy,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import { ConfirmationService, MessageService } from "primeng/api";
import { LibraryService } from "../../service/library.service";
import { Subscription } from "rxjs";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";

@Component({
  selector: "app-model-select-dialog",
  templateUrl: "./model-select-dialog.component.html",
  providers: [ConfirmationService, MessageService],
})
export class BookModelSelectDialogComponent implements OnInit, OnDestroy {
  constructor(private libraryService: LibraryService) {}
  modelsSubscription!: Subscription;
  embeddingSubscription!: Subscription;
  modelOptions: ModelOptions[] = [];
  embeddingOptions: ModelOptions[] = [];
  selectedModel!: string;
  selectedEmbedding!: string;
  @Input() showEmbeddings: boolean = false;
  @Input() visible: boolean = false;
  @Output() onSubmit = new EventEmitter<string>();
  @Output() onHide = new EventEmitter<void>();

  ngOnDestroy() {
    this.modelsSubscription.unsubscribe();
    this.embeddingSubscription.unsubscribe();
  }

  ngOnInit() {
    this.modelsSubscription = this.libraryService.reasoningList.subscribe(
      (models: ModelOptions[]) => {
        this.modelOptions = models;
      }
    );

    this.embeddingSubscription = this.libraryService.embeddingList.subscribe(
      (models: ModelOptions[]) => {
        this.embeddingOptions = models;
      }
    );
    this.libraryService.getOnlineSkills();
  }

  selectOption(value: string) {
    this.selectedModel = value;
  }

  selectEmbeddingOption(value: string) {
    this.selectedEmbedding = value;
  }

  onHideButton() {
    this.onHide.emit();
  }

  submit() {
    this.visible = false;
    if (this.showEmbeddings)
      this.onSubmit.emit(
        [this.selectedModel, this.selectedEmbedding].join(",")
      );
    else this.onSubmit.emit(this.selectedModel);
  }
}
