import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ChatAppComponent } from "./component/assistant.component";
import { DigitalAlliesComponent } from "./component/digital-allies/digital-allies.component";
import { EditAllyComponent } from "./component/edit-ally/edit-ally.component";

@NgModule({
  imports: [
    RouterModule.forChild([{ path: "", component: ChatAppComponent }]),
    RouterModule.forChild([
      {
        path: "allies",
        component: DigitalAlliesComponent,
        data: { breadcrumb: "Digital Allies" },
      },
    ]),
    RouterModule.forChild([
      {
        path: "edit-ally/:id",
        component: EditAllyComponent,
        data: { breadcrumb: "Edit Ally" },
      },
    ]),
  ],
  exports: [RouterModule],
})
export class ChatAppRoutingModule {}
