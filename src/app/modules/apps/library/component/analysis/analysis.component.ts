import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewChecked,
  EventEmitter,
} from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { SocketService } from "src/app/service/sockets.service";
import { LibraryService } from "../../service/library.service";
import { LibraryBook } from "../../api/library-book";
import { LibraryBookContent } from "../../api/library-book-content";
import { DomSanitizer } from "@angular/platform-browser";
import { Subscription } from "rxjs";
import { defaultThrottleConfig } from "rxjs/internal/operators/throttle";

@Component({
  templateUrl: "./analysis.component.html",
  providers: [ConfirmationService, MessageService],
})
export class BookAnalysisComponent implements OnInit, OnDestroy {
  constructor(
    private layoutService: LayoutService,
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private libraryService: LibraryService,
    private confirmationService: ConfirmationService,
    private sanitizer: DomSanitizer
  ) {}

  content: LibraryBookContent[] = [];
  currentBook!: LibraryBook;
  currentBookId!: number;
  showModelDialog: boolean = false;
  booksSubscription!: Subscription;
  contentSubscription!: Subscription;
  stopSubscription!: Subscription;
  progressSubscription!: Subscription;
  jobsSubscription!: Subscription;
  progressVisible: boolean = false;
  jobsRunning: boolean = true;
  stopEnabled: boolean = true;
  progressValue: number = 0;
  toggleState: any = {
    fiction_scene: false,
    fiction_qa: false,
    fiction_characters: false,
    fiction_short_description: false,
  };

  analysisOptions = [
    {
      label: "Location Extract",
      value: "fiction_scene",
    },
    {
      label: "Q/A Extract",
      value: "fiction_qa",
    },
    {
      label: "Characters Extract",
      value: "fiction_characters",
    },
    {
      label: "Summary Extract",
      value: "fiction_short_description",
    },
  ];

  toggleAll($event: Event, option: string) {
    $event.preventDefault();
    const content = JSON.parse(JSON.stringify(this.content));
    for (let i = 0; i < content.length; i++) {
      const current = content[i];
      if (!this.toggleState[option]) {
        if (
          current.analyze.indexOf(option) == -1 &&
          !current.processed_analysis.includes(option)
        )
          current.analyze.push(option);
      } else {
        const index = current.analyze.indexOf(option);
        if (index > -1) current.analyze.splice(index, 1);
      }
    }
    this.toggleState[option] = this.toggleState[option] ? false : true;
    this.content = content;
  }

  ngOnDestroy() {
    this.contentSubscription.unsubscribe();
    this.booksSubscription.unsubscribe();
    this.progressSubscription.unsubscribe();
    this.stopSubscription.unsubscribe();
    this.jobsSubscription.unsubscribe();
  }

  ngOnInit() {
    this.progressSubscription = this.libraryService.progressBarUpdate.subscribe(
      (progressUpdate: any) => {
        if (progressUpdate.job != `book-${this.currentBookId}-ai-analysis`)
          return;
        this.progressValue = Math.floor(
          (progressUpdate.current / progressUpdate.total) * 100
        );
        if (this.progressValue == 100) {
          this.libraryService.getBookContent(this.currentBook.id);
        }
        this.progressVisible = this.progressValue == 100 ? false : true;
      }
    );

    this.stopSubscription = this.libraryService.stopJobFinished.subscribe(
      (jobName: string) => {
        if (jobName != `book-${this.currentBook.id}-ai-analysis`) return;
        this.progressVisible = false;
        this.libraryService.getBookContent(this.currentBook.id);
      }
    );

    this.booksSubscription = this.libraryService.bookList.subscribe(
      (books: LibraryBook[]) => {
        this.currentBook = books[0];
      }
    );
    this.contentSubscription = this.libraryService.bookContent.subscribe(
      (content: LibraryBookContent[]) => {
        for (let i = 0; i < content.length; i++) {
          try {
            content[i].processed_analysis = JSON.parse(
              content[i].processed_analysis
            );
          } catch (ex) {
            continue;
          }

          content[i].analyze = [];
          if (
            content[i].content.indexOf("Project Gutenberg") !== -1 ||
            content[i].file == "pg-header" ||
            content[i].file == "pg-footer" ||
            content[i].file == "coverpage-wrapper"
          ) {
            continue;
          }

          for (let j = 0; j < this.analysisOptions.length; j++) {
            if (
              content[i].processed_analysis.includes(
                this.analysisOptions[j].value
              )
            )
              continue;
            content[i].analyze.push(this.analysisOptions[j].value);
          }
        }
        this.content = content;
        this.stopEnabled = true;
      }
    );

    this.jobsSubscription = this.libraryService.jobsStatus.subscribe((jobs) => {
      let jobsRunning = false;
      for (let key in jobs.status) {
        const job = jobs.status[key];
        if (key == `book-${this.currentBookId}-ai-analysis` && job.running) {
          this.progressVisible = true;
          this.progressValue = Math.floor(
            (job.finished_requests / job.total_requests) * 100
          );
        }
        if (jobs.status[key].running == true) jobsRunning = true;
      }
      this.jobsRunning = jobsRunning;
      this.libraryService.getBookContent(this.currentBookId);
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
  }

  allowHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getBookCover(book: LibraryBook) {
    return this.libraryService.getBaseUrl() + book.cover;
  }

  hideModelDialog() {
    this.showModelDialog = false;
  }

  handleRunAnalysis(useModel: string) {
    this.showModelDialog = false;
    this.stopEnabled = true;
    this.libraryService.analyzeBook(this.currentBookId, this.content, useModel);
    this.progressValue = 0;
    this.progressVisible = true;
  }

  analyzeBook(book: LibraryBook) {
    this.showModelDialog = true;
  }

  stopBookAnalysis(book: LibraryBook) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to stop AI analysis of ${book.title}?`,
      icon: `pi pi-icon-stopwatch`,
      accept: () => {
        this.stopEnabled = false;
        this.libraryService.stopJob(
          `book-${book.id}-ai-analysis`,
          this.currentBook.id
        );
      },
      reject: () => {},
    });
  }
}
