import { Component, OnDestroy, OnInit, AfterViewChecked } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { SocketService } from "src/app/service/sockets.service";
import { LibraryService } from "../../service/library.service";
import { LibraryBook } from "../../api/library-book";
import { LibraryBookContent } from "../../api/library-book-content";
import { DomSanitizer } from "@angular/platform-browser";
import { Subscription } from "rxjs";
import ePub from "epubjs";

@Component({
  templateUrl: "./book.component.html",
  providers: [ConfirmationService, MessageService],
})
export class BookComponent implements OnInit, OnDestroy {
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
  booksSubscription!: Subscription;

  book: any;
  rendition: any;

  ngOnDestroy() {
    this.booksSubscription.unsubscribe();
  }

  ngOnInit() {
    this.book = ePub();

    this.booksSubscription = this.libraryService.bookList.subscribe(
      (books: LibraryBook[]) => {
        this.currentBook = books[0];
        console.log(this.currentBook);
        this.book.open(
          this.socketService.getBaseUrl() + this.currentBook.filename
        );

        this.rendition = this.book.renderTo("epubViewer", {
          width: "100%",
          height: "600px",
          method: "default",
        });

        this.rendition.on("rendered", () => {
          this.rendition.themes.fontSize(`${this.fontSize}%`);
        });

        this.rendition.display();
      }
    );

    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      if (!id) return;
      this.libraryService.getBook(id);
    });
  }

  prevPage() {
    this.rendition.prev();
  }

  nextPage() {
    this.rendition.next();
  }

  getBookCover(book: LibraryBook) {
    return this.libraryService.getBaseUrl() + book.cover;
  }

  private fontSize: number = 100;

  increaseFontSize() {
    if (this.fontSize < 160) {
      this.fontSize += 10;
      this.rendition.themes.fontSize(`${this.fontSize}%`);
    }
  }

  decreaseFontSize() {
    if (this.fontSize > 80) {
      this.fontSize -= 10;
      this.rendition.themes.fontSize(`${this.fontSize}%`);
    }
  }

  isIncreaseFontSizeDisabled() {
    return this.fontSize >= 160;
  }

  isDecreaseFontSizeDisabled() {
    return this.fontSize <= 80;
  }

  goToFirstPage() {
    this.rendition.display();
  }
}
