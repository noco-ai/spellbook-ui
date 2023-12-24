import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LlmExplorerTabs } from "./component/tabs.component";
import { ChatComponent } from "./component/chat/chat.component";
import { CompletionComponent } from "./component/completion/completion.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: "",
        component: LlmExplorerTabs,
        children: [
          { path: "", redirectTo: "chat", pathMatch: "full" },
          { path: "chat", component: ChatComponent },
          { path: "completion", component: CompletionComponent },
        ],
      },
    ]),
  ],
  exports: [RouterModule],
})
export class LlmExplorerRoutingModule {}
