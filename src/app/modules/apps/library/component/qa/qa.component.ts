import { Component, OnDestroy, OnInit } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router, NavigationEnd, ActivatedRoute } from "@angular/router";
import { ConfirmationService, MessageService, MenuItem } from "primeng/api";
import { Subscription } from "rxjs";
import { LibraryBook } from "../../api/library-book";
import { LibraryService } from "../../service/library.service";
import { LibraryBookAnalysis } from "../../api/library-book-analysis";

@Component({
  templateUrl: "./qa.component.html",
  styleUrls: ["./qa.component.scss"],
  providers: [ConfirmationService, MessageService],
})
export class BookQaComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private libraryService: LibraryService,
    private confirmationService: ConfirmationService
  ) {}

  quizContentIds: number[] = [];
  //getResource: string = "fiction_generate_quiz";
  currentBook!: LibraryBook;
  quizCreationRunning: boolean = false;
  stopEnabled: boolean = true;
  aiAnalysisRunning: boolean = false;
  analysisProgressValue: number = -1;
  progressValue: number = -1;
  currentBookId: number = 0;
  jobsRunning: boolean = false;
  doneLoading: boolean = false;
  showModelDialog: boolean = false;
  jobsSubscription!: Subscription;
  booksSubscription!: Subscription;
  progressSubscription!: Subscription;
  analysisSubscription!: Subscription;
  stopSubscription!: Subscription;
  showAllAnswers = false;
  qaSet: any[] = [];
  quizSet: any[] = [];

  hideModelDialog() {
    this.showModelDialog = false;
  }

  toggleShowAllAnswers() {
    this.showAllAnswers = this.showAllAnswers ? false : true;
  }

  handleRunGenerateQuiz(useModel: string) {
    this.showModelDialog = false;
    this.progressValue = 0;
    this.quizCreationRunning = true;
    this.stopEnabled = true;
    this.libraryService.generateQuiz(this.currentBook.id, useModel);
  }

  generateQuiz(book: LibraryBook) {
    this.showModelDialog = true;
  }

  stopQuizCreation(book: LibraryBook) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to quiz generation for ${book.title}?`,
      icon: `pi pi-icon-stopwatch`,
      accept: () => {
        this.stopEnabled = false;
        this.libraryService.stopJob(
          `book-${this.currentBook.id}-generate-quiz`,
          this.currentBook.id
        );
      },
      reject: () => {},
    });
  }

  selectAnswer(selectedAnswer: any, index: number) {
    selectedAnswer.guess = index;
    if (selectedAnswer.guess != selectedAnswer.answer) {
      selectedAnswer.quiz[index].shaking = true;
      setTimeout(() => (selectedAnswer.quiz[index].shaking = false), 2000);
    }
  }

  shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  ngOnInit() {
    this.stopSubscription = this.libraryService.stopJobFinished.subscribe(
      (jobName: string) => {
        if (jobName != `book-${this.currentBook.id}-generate-quiz`) return;
        this.quizCreationRunning = false;
        this.jobsRunning = false;
        this.libraryService.getBookContent(this.currentBook.id);
      }
    );

    this.progressSubscription = this.libraryService.progressBarUpdate.subscribe(
      (progressUpdate: any) => {
        if (progressUpdate?.job == `book-${this.currentBook.id}-ai-analysis`) {
          this.analysisProgressValue = Math.floor(
            (progressUpdate.current / progressUpdate.total) * 100
          );
          if (this.analysisProgressValue == 100) {
            this.libraryService.getJobStatus([
              `book-${this.currentBookId}-ai-analysis`,
              `book-${this.currentBookId}-generate-quiz`,
            ]);
            this.libraryService.getBook(this.currentBookId);
          }
          this.aiAnalysisRunning =
            this.analysisProgressValue == 100 ? false : true;
        } else if (
          progressUpdate?.job == `book-${this.currentBook.id}-generate-quiz`
        ) {
          this.progressValue = Math.floor(
            (progressUpdate.current / progressUpdate.total) * 100
          );
          if (this.progressValue == 100) {
            this.libraryService.getJobStatus([
              `book-${this.currentBookId}-ai-analysis`,
              `book-${this.currentBookId}-generate-quiz`,
            ]);
          }
          this.quizCreationRunning = this.progressValue == 100 ? false : true;
        }
      }
    );

    /*this.analysisSubscription = this.libraryService.bookAnalysis.subscribe(
      (analysis: LibraryBookAnalysis[]) => {
        let qaSet: any[] = [];
        for (let i = 0; i < analysis.length; i++) {
          if (this.quizContentIds.includes(analysis[i].content_id)) continue;
          try {
            const json = JSON.parse(analysis[i].result);
            if (!json?.length) continue;
            qaSet.push({
              chunk: i + 1,
              qa_set: json,
            });
          } catch (ex) {}
        }
        this.qaSet = qaSet;
        this.doneLoading = true;
        return;
      }
    );*/

    this.booksSubscription = this.libraryService.bookList.subscribe(
      (books: LibraryBook[]) => {
        this.currentBook = books[0];

        this.libraryService.getBookAnalysisByBookAndType(
          this.currentBookId,
          "fiction_generate_quiz",
          (analysis: LibraryBookAnalysis[]) => {
            let quizSet = [];
            for (let i = 0; i < analysis.length; i++) {
              try {
                let answerIndex = null;
                const json = JSON.parse(analysis[i].result);
                if (!json?.quiz || !json?.original_question) continue;
                const newQuiz = [];
                const quiz = this.shuffleArray(
                  JSON.parse(JSON.stringify(json.quiz))
                );
                for (let j = 0; j < json.quiz.length; j++) {
                  newQuiz.push({
                    answer: quiz[j].answer,
                    correct: quiz[j].correct,
                    index: j,
                    shaking: false,
                  });
                  if (quiz[j].correct) answerIndex = j;
                }
                this.quizContentIds.push(analysis[i].content_id);
                quizSet.push({
                  chunk: i + 1,
                  quiz: newQuiz,
                  question: json.original_question,
                  guess: null,
                  answer: answerIndex,
                });
              } catch (ex) {}
            }
            this.quizSet = quizSet;

            this.libraryService.getBookAnalysisByBookAndType(
              this.currentBookId,
              "fiction_qa",
              (analysis: LibraryBookAnalysis[]) => {
                let qaSet: any[] = [];
                for (let i = 0; i < analysis.length; i++) {
                  if (this.quizContentIds.includes(analysis[i].content_id))
                    continue;
                  try {
                    const json = JSON.parse(analysis[i].result);
                    if (!json?.length) continue;
                    qaSet.push({
                      chunk: i + 1,
                      qa_set: json,
                    });
                  } catch (ex) {}
                }
                this.qaSet = qaSet;
                this.doneLoading = true;
                return;
              }
            );
          }
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
        } else if (
          key == `book-${this.currentBookId}-generate-quiz` &&
          job.running
        ) {
          this.quizCreationRunning = true;
          this.progressValue = Math.floor(
            (job.finished_requests / job.total_requests) * 100
          );
        }
        if (jobs.status[key].running == true) jobsRunning = true;
      }
      this.jobsRunning = jobsRunning;

      // get resources
      this.libraryService.getBook(this.currentBookId);
    });

    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      if (!id) return;
      this.currentBookId = id;
      this.libraryService.getJobStatus([
        `book-${id}-ai-analysis`,
        `book-${id}-generate-quiz`,
      ]);
    });
  }

  ngOnDestroy() {
    this.jobsSubscription.unsubscribe();
    this.booksSubscription.unsubscribe();
    this.progressSubscription.unsubscribe();
    //this.analysisSubscription.unsubscribe();
    this.stopSubscription.unsubscribe();
  }
}
