import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AppSettingsRoutingModule } from "./app-settings.routing.module";
import { AppSettingComponent } from "./component/app-setting.component";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { SkillConfigurationModule } from "../skill-configuration/skill-configuration.module";

@NgModule({
  imports: [
    CommonModule,
    AppSettingsRoutingModule,
    SkillConfigurationModule,
    ButtonModule,
    DialogModule,
  ],
  declarations: [AppSettingComponent],
})
export class AppSettingsModule {}
