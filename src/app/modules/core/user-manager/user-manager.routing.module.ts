import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { UserManagerMain } from "./component/main-page.component";
import { UserManagerGroups } from "./component/groups/groups.component";
import { UserManagerList } from "./component/list/list.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: "",
        component: UserManagerMain,
        children: [
          { path: "", redirectTo: "list", pathMatch: "full" },
          { path: "list", component: UserManagerList },
          { path: "groups", component: UserManagerGroups },
        ],
      },
    ]),
  ],
  exports: [RouterModule],
})
export class UserManagerRoutingModule {}
