import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AppSettingComponent } from "./component/app-setting.component";

@NgModule({
  imports: [
    RouterModule.forChild([{ path: "", component: AppSettingComponent }]),
  ],
  exports: [RouterModule],
})
export class AppSettingsRoutingModule {}
