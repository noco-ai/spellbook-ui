import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { SkillConfigurationComponent } from './component/skill-configuration.component';

@NgModule({
  declarations: [SkillConfigurationComponent],
  imports: [
    CommonModule,
    ToastModule,
    TagModule,
    KnobModule,
    FormsModule,
    TableModule,
    ContextMenuModule,
    ConfirmPopupModule,
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
  ],
  exports: [SkillConfigurationComponent] 
})
export class SkillConfigurationModule { }
