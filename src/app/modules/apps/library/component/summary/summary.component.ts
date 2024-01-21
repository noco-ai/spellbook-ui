import { Component, OnDestroy, OnInit } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router, NavigationEnd, ActivatedRoute } from "@angular/router";
import { ConfirmationService, MessageService, MenuItem } from "primeng/api";
import { Subscription } from "rxjs";
import { LibraryBook } from "../../api/library-book";
import { LibraryService } from "../../service/library.service";
import { LibraryBookAnalysis } from "../../api/library-book-analysis";

@Component({
  templateUrl: "./summary.component.html",
  providers: [ConfirmationService, MessageService],
})
export class BookSummaryComponent implements OnInit, OnDestroy {
  constructor(
    private layoutService: LayoutService,
    private router: Router,
    private route: ActivatedRoute,
    private libraryService: LibraryService
  ) {}

  currentBook!: LibraryBook;
  aiAnalysisRunning: boolean = false;
  analysisProgressValue: number = -1;
  currentBookId: number = 0;
  jobsRunning: boolean = false;
  doneLoading: boolean = false;
  jobsSubscription!: Subscription;
  booksSubscription!: Subscription;
  progressSubscription!: Subscription;
  analysisSubscription!: Subscription;
  summary: any[] = [];

  ngOnInit() {
    this.progressSubscription = this.libraryService.progressBarUpdate.subscribe(
      (progressUpdate: any) => {
        console.log(progressUpdate);

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

    this.analysisSubscription = this.libraryService.bookAnalysis.subscribe(
      (analysis: LibraryBookAnalysis[]) => {
        let summary: any[] = [];
        for (let i = 0; i < analysis.length; i++) {
          try {
            if (!analysis[i].result?.trim().length) continue;
            summary.push({ summary: analysis[i].result, chunk: i + 1 });
          } catch (ex) {}
        }
        this.summary = summary;
        this.doneLoading = true;
      }
    );

    this.booksSubscription = this.libraryService.bookList.subscribe(
      (books: LibraryBook[]) => {
        this.currentBook = books[0];
        this.libraryService.getBookAnalysisByBookAndType(
          this.currentBookId,
          "fiction_short_description"
        );
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
        }
        if (jobs.status[key].running == true) jobsRunning = true;
      }
      this.jobsRunning = jobsRunning;

      // get resources
      this.libraryService.getBookAnalysisByBookAndType(
        this.currentBookId,
        "fiction_character_merge"
      );
      this.libraryService.getBook(this.currentBookId);
    });

    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      if (!id) return;
      this.currentBookId = id;
      this.libraryService.getJobStatus([`book-${id}-ai-analysis`]);
    });
  }

  ngOnDestroy() {
    this.jobsSubscription.unsubscribe();
    this.booksSubscription.unsubscribe();
    this.progressSubscription.unsubscribe();
    this.analysisSubscription.unsubscribe();
  }
}
