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
    private confirmationService: ConfirmationService
  ) {}

  currentBook!: LibraryBook;
  currentBookId: number = 0;
  booksSubscription!: Subscription;
  analysisSubscription!: Subscription;
  mapSubscription!: Subscription;
  showGenerateArtworkDialog: boolean = false;
  listView: boolean = false;
  doneLoading: boolean = false;
  rawData: any[] = [];
  map: string = "";

  ngOnDestroy() {
    this.analysisSubscription.unsubscribe();
    this.booksSubscription.unsubscribe();
    this.mapSubscription.unsubscribe();
  }

  ngOnInit() {
    this.mapSubscription = this.libraryService.mapHtml.subscribe((map: any) => {
      this.map = map.html;
      console.log(map);
    });

    this.booksSubscription = this.libraryService.bookList.subscribe(
      (books: LibraryBook[]) => {
        this.currentBook = books[0];
        this.currentBookId = books[0].id;
      }
    );

    this.analysisSubscription = this.libraryService.bookAnalysis.subscribe(
      (analysis: LibraryBookAnalysis[]) => {
        this.rawData = [];
        for (let i = 0; i < analysis.length; i++) {
          try {
            const json = JSON.parse(analysis[i].result);
            this.rawData.push(json);
          } catch (ex) {}
        }
        this.doneLoading = true;
      }
    );

    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      if (!id) return;
      this.libraryService.getBookAnalysisByBookAndType(id, "fiction_scene");
      this.libraryService.getBook(id);
    });
  }

  toggleListView() {
    this.listView = this.listView ? false : true;
  }

  getImageUrl(url: string) {
    return this.libraryService.getBaseUrl() + url;
  }

  generateWorldMap(book: LibraryBook) {
    this.libraryService.generateWorldMap(book.id);
  }

  generateArtwork(book: LibraryBook) {
    this.showGenerateArtworkDialog = true;

    /*this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to generate the location art work for ${book.title}?`,
      icon: `pi pi-icon-stopwatch`,
      accept: () => {
        
      },
      reject: () => {},
    });*/
  }
}
