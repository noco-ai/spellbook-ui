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
import { LlmExplorerRoutingModule } from "./llm-explorer.routing.module";
import { TabMenuModule } from "primeng/tabmenu";
import { LlmExplorerTabs } from "./component/tabs.component";
import { ChatComponent } from "./component/chat/chat.component";
import { CompletionComponent } from "./component/completion/completion.component";
import { TooltipModule } from "primeng/tooltip";
import { AccordionModule } from "primeng/accordion";

@NgModule({
  imports: [
    CommonModule,
    LlmExplorerRoutingModule,
    ConfirmPopupModule,
    ToastModule,
    TagModule,
    KnobModule,
    FormsModule,
    TableModule,
    ContextMenuModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    RippleModule,
    DropdownModule,
    RadioButtonModule,
    CheckboxModule,
    MultiSelectModule,
    SliderModule,
    InputSwitchModule,
    InputTextModule,
    KeyFilterModule,
    TabMenuModule,
    TooltipModule,
    AccordionModule,
  ],
  declarations: [LlmExplorerTabs, ChatComponent, CompletionComponent],
})
export class LlmExplorerModule {}
