import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GolemRoutingModule } from "./servers.routing.module";
import { GolemComponent } from "./component/servers.component";
import { OnlineSkills } from "./component/online-skills/online-skills.component";
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
import { SkillConfigurationModule } from "../skill-configuration/skill-configuration.module";
import { ReactiveFormsModule } from "@angular/forms";
import { RadioButtonModule } from "primeng/radiobutton";
import { CheckboxModule } from "primeng/checkbox";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule } from "primeng/slider";
import { InputSwitchModule } from "primeng/inputswitch";
import { InputTextModule } from "primeng/inputtext";
import { SkillList } from "./component/skill-list/skill-list.component";

@NgModule({
  imports: [
    CommonModule,
    GolemRoutingModule,
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
    SkillConfigurationModule,
    InputTextModule,
  ],
  declarations: [GolemComponent, OnlineSkills, SkillList],
})
export class GolemModule {}
