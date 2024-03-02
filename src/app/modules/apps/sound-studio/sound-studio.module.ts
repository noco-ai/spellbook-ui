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
import { TabMenuModule } from "primeng/tabmenu";
import { TooltipModule } from "primeng/tooltip";
import { AccordionModule } from "primeng/accordion";
import { FileUploadModule } from "primeng/fileupload";
import { ToggleButtonModule } from "primeng/togglebutton";

import { DividerModule } from "primeng/divider";
import { SoundStudioRoutingModule } from "./sound-studio.routing.module";
import { SoundStudioTabs } from "./component/tabs.component";
import { TtsComponent } from "./component/tts/tts.component";
import { AsrComponent } from "./component/asr/asr.component";
import { GenerationComponent } from "./component/generation/generation.component";
import { SoundComponent } from "./component/sound/sound.component";

@NgModule({
  imports: [
    CommonModule,
    SoundStudioRoutingModule,
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
    MultiSelectModule,
    SliderModule,
    InputSwitchModule,
    InputTextModule,
    //KeyFilterModule,
    TabMenuModule,
    //TooltipModule,
    AccordionModule,
  ],
  declarations: [
    SoundStudioTabs,
    TtsComponent,
    AsrComponent,
    SoundComponent,
    GenerationComponent,
  ],
})
export class SoundStudioModule {}
