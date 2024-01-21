import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewChecked,
  ViewChild,
} from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { SocketService } from "src/app/service/sockets.service";
import { LibraryService } from "../../service/library.service";
import { LibraryBook } from "../../api/library-book";
import { Subscription } from "rxjs";
import { FileUpload } from "primeng/fileupload";

@Component({
  templateUrl: "./fiction.component.html",
  providers: [ConfirmationService, MessageService],
})
export class FictionComponent implements OnInit, OnDestroy {
  constructor(
    private layoutService: LayoutService,
    private router: Router,
    private socketService: SocketService,
    private libraryService: LibraryService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  uploadedFiles: any[] = [];
  showMessage: boolean = true;
  idFrozen: boolean = false;
  books: LibraryBook[] = [];
  bookSubscription!: Subscription;
  toastUpdates!: Subscription;
  @ViewChild("fileUploader") fileUploader!: FileUpload;

  ngOnDestroy() {
    this.bookSubscription.unsubscribe();
    this.toastUpdates.unsubscribe();
  }

  ngOnInit() {
    this.toastUpdates = this.socketService.onToastMessage.subscribe(
      (toastData: any) => {
        this.messageService.add(toastData);
      }
    );

    this.bookSubscription = this.libraryService.bookList.subscribe(
      (books: LibraryBook[]) => {
        this.books = books;
      }
    );
    this.libraryService.getBooks();
  }

  onSelect(event: any) {
    this.showMessage = false;
  }

  onClear() {
    this.showMessage = true;
  }

  getBookCover(book: LibraryBook) {
    return this.libraryService.getBaseUrl() + book.cover;
  }

  viewBook(book: LibraryBook) {
    window.location.href = `#/library/book/${book.id}`;
  }

  deleteBook(book: LibraryBook) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete ${book.title}?`,
      icon: `pi pi-icon-trash`,
      accept: () => {
        this.libraryService.deleteBook(book.id);
      },
      reject: () => {},
    });
  }

  uploadFile(event: any) {
    this.socketService.uploadFile(
      event.files,
      "upload/book",
      0,
      "",
      (response: any) => {
        this.fileUploader.clear();
        if (!response || !response.book_id) return;
        this.libraryService.getBooks();
        this.libraryService.ingestBook(response.book_id);
      }
    );
  }
}
