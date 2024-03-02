import { Component, OnDestroy, OnInit, AfterViewChecked } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { LibraryService } from "../../service/library.service";
import { LibraryBook } from "../../api/library-book";
import { Subscription } from "rxjs";
import { LibraryBookAnalysis } from "../../api/library-book-analysis";

@Component({
  templateUrl: "./locations.component.html",
  providers: [ConfirmationService, MessageService],
})
export class BookLocationsComponent implements OnInit, OnDestroy {
  constructor(
    private layoutService: LayoutService,
    private router: Router,
    private route: ActivatedRoute,
    private libraryService: LibraryService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  currentBook!: LibraryBook;
  currentBookId: number = 0;
  booksSubscription!: Subscription;
  mapSubscription!: Subscription;
  toastSubscription!: Subscription;
  jobsSubscription!: Subscription;
  progressSubscription!: Subscription;
  stopSubscription!: Subscription;
  regenerateArtSubscription!: Subscription;
  showGenerateArtworkDialog: boolean = false;
  listView: boolean = false;
  doneLoading: boolean = false;
  rawData: any[] = [];
  map: string = "";

  aiAnalysisRunning: boolean = false;
  analysisProgressValue: number = 0;
  imagePromptGenerationRunning: boolean = false;
  imagePromptProgressValue: number = 0;
  imageGenerationRunning: boolean = false;
  imageProgressValue: number = 0;
  jobsRunning: boolean = false;
  stopImageGenerationEnabled: boolean = true;
  regeneratePrompt: string = "";
  regenerateId: number = 0;
  totalLocationsCount: number = 0;
  totalLocationsWithImagesCount: number = 0;

  ngOnDestroy() {
    this.toastSubscription.unsubscribe();
    this.booksSubscription.unsubscribe();
    this.mapSubscription.unsubscribe();
    this.jobsSubscription.unsubscribe();
    this.progressSubscription.unsubscribe();
    this.stopSubscription.unsubscribe();
    this.regenerateArtSubscription.unsubscribe();
  }

  async updateList() {
    this.libraryService.getBookAnalysisByBookAndType(
      this.currentBookId,
      "fiction_scene",
      (analysis: LibraryBookAnalysis[]) => {
        this.rawData = [];
        this.totalLocationsWithImagesCount = 0;
        for (let i = 0; i < analysis.length; i++) {
          try {
            const json = JSON.parse(analysis[i].result);
            if (json.image) this.totalLocationsWithImagesCount++;
            json.id = analysis[i].id;
            json.user_id = analysis[i].user_id;
            this.rawData.push(json);
          } catch (ex) {}
        }
        this.totalLocationsCount = this.rawData.length;
        this.doneLoading = true;
      }
    );
  }

  ngOnInit() {
    this.toastSubscription = this.libraryService.onToastMessage.subscribe(
      (message) => {
        this.messageService.add(message);
      }
    );

    this.mapSubscription = this.libraryService.mapHtml.subscribe((map: any) => {
      this.map = map.html;
    });

    this.booksSubscription = this.libraryService.bookList.subscribe(
      (books: LibraryBook[]) => {
        this.currentBook = books[0];
        this.currentBookId = books[0].id;
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
          key == `book-${this.currentBookId}-fiction-locations-image-prompts` &&
          job.running
        ) {
          this.imagePromptGenerationRunning = true;
          this.imagePromptProgressValue = Math.floor(
            (job.finished_requests / job.total_requests) * 100
          );
        } else if (
          key == `book-${this.currentBookId}-fiction-locations-images` &&
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
      this.updateList();
    });

    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      if (!id) return;

      this.currentBookId = id;
      this.libraryService.getJobStatus([
        `book-${id}-ai-analysis`,
        `book-${id}-fiction-locations-image-prompts`,
        `book-${id}-fiction-locations-images`,
      ]);
      this.libraryService.getBook(id);
    });

    this.stopSubscription = this.libraryService.stopJobFinished.subscribe(
      (jobName: string) => {
        if (
          jobName ==
          `book-${this.currentBook.id}-fiction-locations-image-prompts`
        ) {
          this.libraryService.stopJob(
            `book-${this.currentBook.id}-fiction-locations-images`,
            this.currentBook.id
          );
          return;
        }

        if (jobName == `book-${this.currentBook.id}-fiction-locations-images`) {
          this.imageGenerationRunning = false;
          this.stopImageGenerationEnabled = true;
          this.imagePromptGenerationRunning = false;
          return;
        }
      }
    );

    this.regenerateArtSubscription =
      this.libraryService.regenerateArtFinished.subscribe((data) => {
        for (let i = 0; i < this.rawData.length; i++) {
          const current = this.rawData[i];
          if (current.id == data.resource_id) {
            current.image = data.image;
            break;
          }
        }
      });

    this.progressSubscription = this.libraryService.progressBarUpdate.subscribe(
      (progressUpdate: any) => {
        if (
          progressUpdate?.job ==
          `book-${this.currentBook.id}-fiction-locations-image-prompts`
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
          `book-${this.currentBook.id}-fiction-locations-images`
        ) {
          this.imageProgressValue = Math.floor(
            (progressUpdate.current / progressUpdate.total) * 100
          );
          this.imageGenerationRunning =
            this.imageProgressValue == 100 ? false : true;
          if (this.imageProgressValue == 100) this.updateList();
          this.stopImageGenerationEnabled = true;
          return;
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
  }

  stopGeneration() {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to stop generating location images?`,
      icon: `pi pi-stop`,
      accept: () => {
        this.stopImageGenerationEnabled = false;
        this.libraryService.stopJob(
          `book-${this.currentBook.id}-fiction-locations-image-prompts`,
          this.currentBook.id
        );
      },
      reject: () => {},
    });
  }

  startImageGeneration() {
    if (this.regenerateId) return;
    this.imageGenerationRunning = true;
    this.imagePromptGenerationRunning = true;
    this.imageProgressValue = 0;
    this.imagePromptProgressValue = 0;
  }

  regenerateArt(item: any) {
    this.regeneratePrompt = item.image_prompt;
    this.regenerateId = item.id;
    this.showGenerateArtworkDialog = true;
  }

  deleteLocation(id: number) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete this location?`,
      icon: `pi pi-trash`,
      accept: () => {
        this.libraryService.deleteBookAnalysis(id, (data: any) => {
          this.updateList();
        });
      },
      reject: () => {},
    });
  }

  sendToAlly(userId: number, imagePath: string) {
    const imagesKey = `user-location-${userId}`;
    const existingImagesJson = localStorage.getItem(imagesKey);
    const existingImages = existingImagesJson
      ? JSON.parse(existingImagesJson)
      : [];

    if (!existingImages.includes(imagePath)) {
      existingImages.push(imagePath);
      localStorage.setItem(imagesKey, JSON.stringify(existingImages));
    }

    this.messageService.add({
      severity: "info",
      summary: "Edit ally to link this image.",
      detail:
        "This image is now available to be used for ally location images.",
      life: 5000,
    });
  }

  hideImageDialog() {
    this.showGenerateArtworkDialog = false;
  }

  toggleListView() {
    this.listView = this.listView ? false : true;
  }

  getImageUrl(url: string) {
    const file = url || "asset/spellbook/core/art-placeholder.png";
    return this.libraryService.getBaseUrl() + file;
  }

  generateWorldMap(book: LibraryBook) {
    this.libraryService.generateWorldMap(book.id);
  }

  generateArtwork(book: LibraryBook) {
    this.regeneratePrompt = "";
    this.regenerateId = 0;
    this.showGenerateArtworkDialog = true;
  }
}
