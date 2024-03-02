import {
  Component,
  OnDestroy,
  OnInit,
  Input,
  EventEmitter,
  Output,
} from "@angular/core";
import { ConfirmationService, MessageService } from "primeng/api";
import { LibraryService } from "../../service/library.service";
import { LibraryBook } from "../../api/library-book";
import { Subscription } from "rxjs";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";

@Component({
  selector: "app-art-dialog",
  templateUrl: "./art-dialog.component.html",
  styleUrls: ["./art-dialog.component.scss"],
  providers: [ConfirmationService, MessageService],
})
export class BookArtDialogComponent implements OnInit, OnDestroy {
  constructor(private libraryService: LibraryService) {}
  modelsSubscription!: Subscription;
  modelOptions: ModelOptions[] = [];
  guidanceScale: number = 7.5;
  steps: number = 40;
  artist: string = "";
  artStyle: string = "Watercolor";
  selectedModel!: string;
  @Input() visible: boolean = false;
  @Input() book!: LibraryBook;
  @Input() resourceType: string = "location";
  @Input() regenerate: string = "";
  @Input() regeneratePrompt: string = "";
  @Input() regenerateId: number = 0;
  @Output() onHide = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<void>();

  styleOptions = [
    {
      label: "Watercolor",
      value: "Watercolor",
    },
    {
      label: "Oil Painting",
      value: "Oil Painting",
    },
    {
      label: "Acrylic",
      value: "Acrylic",
    },
    {
      label: "Ink Wash",
      value: "Ink Wash",
    },
    {
      label: "Pastel",
      value: "Pastel",
    },
    {
      label: "Charcoal Drawing",
      value: "Charcoal Drawing",
    },
    {
      label: "Pencil Sketch",
      value: "Pencil Sketch",
    },
    {
      label: "Digital Art",
      value: "Digital Art",
    },
    {
      label: "Photography",
      value: "Photography",
    },
    {
      label: "Collage",
      value: "Collage",
    },
    {
      label: "Printmaking",
      value: "Printmaking",
    },
    {
      label: "Graffiti",
      value: "Graffiti",
    },
    {
      label: "Mosaic",
      value: "Mosaic",
    },
    {
      label: "Pixel Art",
      value: "Pixel Art",
    },
    {
      label: "Vector Art",
      value: "Vector Art",
    },
    {
      label: "3D Rendering",
      value: "3D Rendering",
    },
    {
      label: "Concept Art",
      value: "Concept Art",
    },
    {
      label: "Anime/Manga Style",
      value: "Anime/Manga Style",
    },
  ];

  ngOnDestroy() {
    this.modelsSubscription.unsubscribe();
  }

  ngOnInit() {
    this.modelsSubscription = this.libraryService.imageModelList.subscribe(
      (models: ModelOptions[]) => {
        this.modelOptions = models;
      }
    );
    this.libraryService.getOnlineSkills();
  }

  onDialogHide() {
    this.onHide.emit();
  }

  onShowDialog() {
    this.regeneratePrompt = this.regenerate;
  }

  submitGenerateArtwork(book: LibraryBook) {
    if (this.regeneratePrompt.length) {
      this.libraryService.regenerateArtwork(
        book.id,
        this.selectedModel,
        this.guidanceScale,
        this.steps,
        this.resourceType,
        this.regeneratePrompt,
        this.regenerateId
      );
    } else {
      this.libraryService.generateArtwork(
        book.id,
        this.artStyle,
        this.artist,
        this.selectedModel,
        this.guidanceScale,
        this.steps,
        this.resourceType
      );
    }
    this.onSubmit.emit();
    this.visible = false;
  }
}
