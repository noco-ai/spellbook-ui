import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AppManagerMain } from "./component/main-page.component";
import { AppManagerSkills } from "./component/skill/skill.component";
import { AppManagerChatAbilities } from "./component/chat-ability/chat-ability.component";
import { AppManagerApplications } from "./component/application/application.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: "",
        component: AppManagerMain,
        children: [
          { path: "", redirectTo: "applications", pathMatch: "full" },
          { path: "applications", component: AppManagerApplications },
          { path: "skills", component: AppManagerSkills },
          { path: "chat-abilities", component: AppManagerChatAbilities },
        ],
      },
    ]),
  ],
  exports: [RouterModule],
})
export class AppManagerRoutingModule {}
