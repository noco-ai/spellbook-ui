import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { KnobModule } from "primeng/knob";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { RippleModule } from "primeng/ripple";
import { DropdownModule } from "primeng/dropdown";
import { TagModule } from "primeng/tag";
import { ContextMenuModule } from "primeng/contextmenu";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { ToastModule } from "primeng/toast";
import { ReactiveFormsModule } from "@angular/forms";
import { RadioButtonModule } from "primeng/radiobutton";
import { CheckboxModule } from "primeng/checkbox";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule } from "primeng/slider";
import { InputSwitchModule } from "primeng/inputswitch";
import { InputTextModule } from "primeng/inputtext";
import { KeyFilterModule } from "primeng/keyfilter";
import { LibraryRoutingModule } from "./library.routing.module";
import { TabMenuModule } from "primeng/tabmenu";
import { LibraryTabs } from "./component/tabs.component";
import { TooltipModule } from "primeng/tooltip";
import { AccordionModule } from "primeng/accordion";
import { FileUploadModule } from "primeng/fileupload";
import { FictionComponent } from "./component/fiction/fiction.component";
import { ToggleButtonModule } from "primeng/togglebutton";
import { BookComponent } from "./component/book/book.component";
import { BookAnalysisComponent } from "./component/analysis/analysis.component";
import { BookLocationsComponent } from "./component/locations/locations.component";
import { BookArtDialogComponent } from "./component/art-dialog/art-dialog.component";
import { BookCharactersComponent } from "./component/characters/characters.component";
import { LibraryNonfictionComponent } from "./component/non-fiction/non-fiction.component";
import { DividerModule } from "primeng/divider";
import { BookModelSelectDialogComponent } from "./component/model-select-dialog/model-select-dialog.component";
import { BookQaComponent } from "./component/qa/qa.component";
import { BookSummaryComponent } from "./component/summary/summary.component";

@NgModule({
  imports: [
    CommonModule,
    LibraryRoutingModule,
    FileUploadModule,
    ConfirmPopupModule,
    ToastModule,
    //TagModule,
    //KnobModule,
    FormsModule,
    TableModule,
    DividerModule,
    //ContextMenuModule,
    ButtonModule,
    ToggleButtonModule,
    DialogModule,
    //ReactiveFormsModule,
    //RippleModule,
    DropdownModule,
    //RadioButtonModule,
    CheckboxModule,
    //MultiSelectModule,
    SliderModule,
    InputSwitchModule,
    //InputTextModule,
    //KeyFilterModule,
    TabMenuModule,
    //TooltipModule,
    //AccordionModule,
    RadioButtonModule,
  ],
  declarations: [
    LibraryTabs,
    FictionComponent,
    LibraryNonfictionComponent,
    BookComponent,
    BookAnalysisComponent,
    BookLocationsComponent,
    BookCharactersComponent,
    BookArtDialogComponent,
    BookModelSelectDialogComponent,
    BookQaComponent,
    BookSummaryComponent,
  ],
})
export class LibraryModule {}
