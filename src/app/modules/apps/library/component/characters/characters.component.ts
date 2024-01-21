import { Component, OnDestroy, OnInit, AfterViewChecked } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { LibraryService } from "../../service/library.service";
import { LibraryBook } from "../../api/library-book";
import { LibraryBookContent } from "../../api/library-book-content";
import { Subscription } from "rxjs";
import { LibraryBookAnalysis } from "../../api/library-book-analysis";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";

@Component({
  templateUrl: "./characters.component.html",
  styleUrls: ["./characters.component.scss"],
  providers: [ConfirmationService, MessageService],
})
export class BookCharactersComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private libraryService: LibraryService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  content: LibraryBookContent[] = [];
  currentBook!: LibraryBook;
  currentBookId: number = 0;
  booksSubscription!: Subscription;
  modelsSubscription!: Subscription;
  toastSubscription!: Subscription;
  imageModelsSubscription!: Subscription;
  analysisSubscription!: Subscription;
  mergeCharacterSubscription!: Subscription;
  regenerateArtSubscription!: Subscription;
  jobsSubscription!: Subscription;
  stopSubscription!: Subscription;
  rawData: any[] = [];
  showGenerateArtworkDialog: boolean = false;
  jobsRunning: boolean = true;
  rawCharacters: any[] = [];
  charactersOptions: any[] = [];
  getResource: string = "merge";
  mergedCharacters: any[] = [];
  editDialogVisible: boolean = false;
  modelOptions: any[] = [];
  selectedMerge!: number;
  editingCharacter: any = {};
  listView: boolean = false;
  withImagesCount: number = 0;
  totalMergedCount: number = 0;
  mergeRunning: boolean = false;
  progressSubscription!: Subscription;
  progressValue: number = 0;
  stopMergeEnabled: boolean = false;
  doneLoading: boolean = false;
  imageGenerationRunning: boolean = false;
  imageProgressValue: number = 0;
  imagePromptGenerationRunning: boolean = false;
  imagePromptProgressValue: number = 0;
  stopImageGenerationEnabled: boolean = true;
  aiAnalysisRunning: boolean = false;
  analysisProgressValue: number = 0;
  showModelDialog: boolean = false;
  imageGenerationEnabled: boolean = false;
  regeneratePrompt: string = "";
  regenerateId: number = 0;

  hideModelDialog() {
    this.showModelDialog = false;
  }

  generateArtwork(book: LibraryBook) {
    this.regeneratePrompt = "";
    this.regenerateId = 0;
    this.showGenerateArtworkDialog = true;
  }

  toggleListView() {
    this.listView = this.listView ? false : true;
  }

  editCharacter(character: any) {
    this.selectedMerge = 0;
    this.editDialogVisible = true;
    this.editingCharacter = JSON.parse(JSON.stringify(character));
  }

  submitEditCharacter() {
    this.editDialogVisible = false;
    const payload = JSON.parse(JSON.stringify(this.editingCharacter));
    delete payload.id;

    if (this.selectedMerge) {
      if (this.selectedMerge == this.editingCharacter.id) {
        this.messageService.add({
          severity: "error",
          summary: "Can't merge character",
          detail: "You can not merge a character with itself!",
        });
        return;
      }

      // send data to server
      this.libraryService.mergeRefinedCharacter(
        this.editingCharacter.id,
        this.selectedMerge
      );
      return;
    }

    const id = this.editingCharacter.id;
    this.libraryService.updateAnalysis(
      id,
      JSON.stringify(payload),
      (data: any) => {
        this.getResource = "merge";
        this.libraryService.getBookAnalysisByBookAndType(
          this.currentBook.id,
          "fiction_character_merge"
        );
      }
    );
    this.editingCharacter = {};
  }

  hideImageDialog() {
    this.showGenerateArtworkDialog = false;
  }

  refineCharacters(currentBook: LibraryBook) {
    this.showModelDialog = true;
  }

  refineCharactersSubmit(useModel: string) {
    console.log(useModel);
    const models = useModel.split(",");
    this.showModelDialog = false;
    this.libraryService.refineCharacters(
      this.currentBookId,
      models[0],
      models[1]
    );
    this.mergeRunning = true;
  }

  stopImageGeneration(currentBook: LibraryBook) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to stop generating character images?`,
      icon: `pi pi-stop`,
      accept: () => {
        this.stopImageGenerationEnabled = false;
        this.libraryService.stopJob(
          `book-${this.currentBook.id}-fiction-characters-image-prompts`,
          this.currentBook.id
        );
      },
      reject: () => {},
    });
  }

  stopRefineCharacters(currentBook: LibraryBook) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to stop refining and merging raw character data?`,
      icon: `pi pi-stop`,
      accept: () => {
        this.stopMergeEnabled = false;
        this.libraryService.stopJob(
          `book-${this.currentBook.id}-merge-fiction-characters-raw`,
          this.currentBook.id
        );
      },
      reject: () => {},
    });
  }

  mergeValuesByKey(arrayOfObjects: Array<any>, keyName: string) {
    return arrayOfObjects
      .filter((obj) => obj[keyName] !== null && obj[keyName] !== undefined)
      .map((obj) => obj[keyName])
      .join("\n");
  }

  lengthCheck(arrayOfObjects: Array<any>, keyName: string) {
    return arrayOfObjects
      .filter((obj) => obj[keyName] !== null && obj[keyName] !== undefined)
      .map((obj) => obj[keyName]).length;
  }

  deleteRefinedCharacter(id: number) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete this character?`,
      icon: `pi pi-trash`,
      accept: () => {
        this.libraryService.deleteRefinedCharacter(id, (data: any) => {
          this.getResource = "merge";
          this.libraryService.getBookAnalysisByBookAndType(
            this.currentBook.id,
            "fiction_character_merge"
          );
        });
      },
      reject: () => {},
    });
  }

  convertToAlly(id: number) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to create an AI ally from this character?`,
      icon: `pi pi-link`,
      accept: () => {
        this.libraryService.convertCharacterToAlly(id);
      },
      reject: () => {},
    });
  }

  regenerateCharacterArt(character: any) {
    this.showGenerateArtworkDialog = true;
    this.regeneratePrompt = character.image_prompt;
    this.regenerateId = character.id;
  }

  titleCase(str: string) {
    var splitStr = str.toLowerCase().split(" ");
    for (var i = 0; i < splitStr.length; i++) {
      splitStr[i] =
        splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }

    return splitStr.join(" ");
  }

  ngOnDestroy() {
    this.analysisSubscription.unsubscribe();
    this.booksSubscription.unsubscribe();
    this.progressSubscription.unsubscribe();
    this.stopSubscription.unsubscribe();
    this.imageModelsSubscription.unsubscribe();
    this.toastSubscription.unsubscribe();
    this.regenerateArtSubscription.unsubscribe();
    this.mergeCharacterSubscription.unsubscribe();
  }

  ngOnInit() {
    this.doneLoading = false;
    this.toastSubscription = this.libraryService.onToastMessage.subscribe(
      (message) => {
        this.messageService.add(message);
      }
    );

    this.mergeCharacterSubscription =
      this.libraryService.mergeRefinedFinished.subscribe((data) => {
        this.mergedCharacters = this.mergedCharacters.filter(
          (item) => item.id !== data.remove_id
        );
        for (let i = 0; i < this.mergedCharacters.length; i++) {
          if (this.mergedCharacters[i].id == data.updated_id) {
            this.mergedCharacters[i].physical_description =
              data.physical_description;
            this.mergedCharacters[i].personality_description =
              data.personality_description;
            break;
          }
        }
      });

    this.regenerateArtSubscription =
      this.libraryService.regenerateArtFinished.subscribe((data) => {
        for (let i = 0; i < this.mergedCharacters.length; i++) {
          const current = this.mergedCharacters[i];
          if (current.id == data.resource_id) {
            current.image = data.image;
            break;
          }
        }
      });

    this.stopSubscription = this.libraryService.stopJobFinished.subscribe(
      (jobName: string) => {
        if (
          jobName ==
          `book-${this.currentBook.id}-fiction-characters-image-prompts`
        ) {
          this.libraryService.stopJob(
            `book-${this.currentBook.id}-fiction-characters-images`,
            this.currentBook.id
          );
          return;
        }

        if (
          jobName == `book-${this.currentBook.id}-fiction-characters-images`
        ) {
          this.imageGenerationRunning = false;
          this.getResource = "merge";
          this.libraryService.getBookAnalysisByBookAndType(
            this.currentBook.id,
            "fiction_character_merge"
          );
          this.stopImageGenerationEnabled = true;
          this.imagePromptGenerationRunning = false;
          return;
        }

        if (
          jobName != `book-${this.currentBook.id}-merge-fiction-characters-raw`
        )
          return;
        this.mergeRunning = false;
        this.getResource = "merge";
        this.libraryService.getBookAnalysisByBookAndType(
          this.currentBook.id,
          "fiction_character_merge"
        );
      }
    );

    this.progressSubscription = this.libraryService.progressBarUpdate.subscribe(
      (progressUpdate: any) => {
        console.log(progressUpdate);

        if (
          progressUpdate?.job ==
          `book-${this.currentBook.id}-fiction-characters-image-prompts`
        ) {
          this.imagePromptProgressValue = Math.floor(
            (progressUpdate.current / progressUpdate.total) * 100
          );
          this.imagePromptGenerationRunning =
            this.imagePromptProgressValue == 100 ? false : true;
          return;
        }

        if (
          progressUpdate?.job ==
          `book-${this.currentBook.id}-fiction-characters-images`
        ) {
          this.imageProgressValue = Math.floor(
            (progressUpdate.current / progressUpdate.total) * 100
          );
          this.imageGenerationRunning =
            this.imageProgressValue == 100 ? false : true;
          if (this.imageProgressValue == 100) {
            this.getResource = "merge";
            this.libraryService.getBookAnalysisByBookAndType(
              this.currentBook.id,
              "fiction_character_merge"
            );
          }
          this.stopImageGenerationEnabled = true;
          return;
        }

        if (
          progressUpdate?.job ==
          `book-${this.currentBook.id}-merge-fiction-characters-raw`
        ) {
          this.progressValue = Math.floor(
            (progressUpdate.current / progressUpdate.total) * 100
          );
          if (this.progressValue == 100) {
            this.getResource = "merge";
            this.libraryService.getBookAnalysisByBookAndType(
              this.currentBook.id,
              "fiction_character_merge"
            );
          }
          this.mergeRunning = this.progressValue == 100 ? false : true;
          this.stopMergeEnabled = true;
        }

        if (progressUpdate?.job == `book-${this.currentBook.id}-ai-analysis`) {
          this.analysisProgressValue = Math.floor(
            (progressUpdate.current / progressUpdate.total) * 100
          );
          if (this.analysisProgressValue == 100) {
            this.libraryService.getJobStatus([
              `book-${this.currentBookId}-ai-analysis`,
            ]);
          }

          this.aiAnalysisRunning =
            this.analysisProgressValue == 100 ? false : true;
        }
      }
    );

    this.booksSubscription = this.libraryService.bookList.subscribe(
      (books: LibraryBook[]) => {
        this.currentBook = books[0];
      }
    );

    this.analysisSubscription = this.libraryService.bookAnalysis.subscribe(
      (analysis: LibraryBookAnalysis[]) => {
        if (this.getResource == "merge") {
          let withImages = 0;
          const mergedCharacters = [];
          for (let i = 0; i < analysis.length; i++) {
            try {
              const match = analysis[i].result.match(/\{.*?\}/gs);
              if (!match) continue;
              const jsonData = JSON.parse(match[0]);
              jsonData["id"] = analysis[i].id;
              if (jsonData.image) withImages++;
              mergedCharacters.push(jsonData);
            } catch (ex) {}
          }

          mergedCharacters.sort((a, b) => {
            return b.found_in_content - a.found_in_content;
          });
          this.totalMergedCount = mergedCharacters.length;
          this.withImagesCount = withImages;
          if (!this.withImagesCount) this.listView = true;
          this.mergedCharacters = mergedCharacters;
          this.charactersOptions = [
            {
              label: "",
              value: 0,
            },
          ];
          for (let i = 0; i < mergedCharacters.length; i++) {
            this.charactersOptions.push({
              label: mergedCharacters[i].name,
              value: mergedCharacters[i].id,
            });
          }

          this.charactersOptions.sort((a, b) => {
            if (a.label < b.label) {
              return -1;
            }
            if (a.label > b.label) {
              return 1;
            }
            return 0;
          });

          // get raw data
          this.getResource = "raw";
          this.libraryService.getBookAnalysisByBookAndType(
            this.currentBookId,
            "fiction_characters"
          );
          return;
        }

        this.rawData = [];
        for (let i = 0; i < analysis.length; i++) {
          try {
            const json = JSON.parse(analysis[i].result);
            this.rawData = [...this.rawData, ...json];
          } catch (ex) {}
        }

        const merged = new Map();
        for (let i = 0; i < this.rawData.length; i++) {
          if (!this.rawData[i].name || this.rawData[i].processed) continue;
          let upperName = this.rawData[i].name.toUpperCase();
          const list = merged.has(upperName) ? merged.get(upperName) : [];
          list.push(this.rawData[i]);
          merged.set(upperName, list);
        }

        this.rawCharacters = Array.from(merged.values()).sort((a, b) => {
          return a[0].name.localeCompare(b[0].name);
        });
        this.doneLoading = true;
      }
    );

    this.jobsSubscription = this.libraryService.jobsStatus.subscribe((jobs) => {
      let jobsRunning = false;
      for (let key in jobs.status) {
        const job = jobs.status[key];
        if (key == `book-${this.currentBookId}-ai-analysis` && job.running) {
          this.aiAnalysisRunning = true;
          this.analysisProgressValue = Math.floor(
            (job.finished_requests / job.total_requests) * 100
          );
        } else if (
          key == `book-${this.currentBookId}-merge-fiction-characters-raw` &&
          job.running
        ) {
          this.stopMergeEnabled = true;
          this.mergeRunning = true;
          this.progressValue = Math.floor(
            (job.finished_requests / job.total_requests) * 100
          );
        } else if (
          key ==
            `book-${this.currentBookId}-fiction-characters-image-prompts` &&
          job.running
        ) {
          this.imagePromptGenerationRunning = true;
          this.imagePromptProgressValue = Math.floor(
            (job.finished_requests / job.total_requests) * 100
          );
        } else if (
          key == `book-${this.currentBookId}-fiction-characters-images` &&
          job.running
        ) {
          this.imageGenerationRunning = true;
          this.imageProgressValue = Math.floor(
            (job.finished_requests / job.total_requests) * 100
          );
        }
        if (jobs.status[key].running == true) jobsRunning = true;
      }
      this.jobsRunning = jobsRunning;

      // get resources
      this.getResource = "merge";
      this.libraryService.getBookAnalysisByBookAndType(
        this.currentBookId,
        "fiction_character_merge"
      );
      this.currentBookId = this.currentBookId;
      this.libraryService.getBook(this.currentBookId);
    });

    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      if (!id) return;
      this.currentBookId = id;
      this.libraryService.getJobStatus([
        `book-${id}-ai-analysis`,
        `book-${id}-merge-fiction-characters-raw`,
        `book-${id}-fiction-characters-image-prompts`,
        `book-${id}-fiction-characters-images`,
      ]);
    });

    this.imageModelsSubscription = this.libraryService.imageModelList.subscribe(
      (list: ModelOptions[]) => {
        this.imageGenerationEnabled = list.length ? true : false;
      }
    );
  }

  getImageUrl(url: string) {
    return this.libraryService.getBaseUrl() + url;
  }
}
