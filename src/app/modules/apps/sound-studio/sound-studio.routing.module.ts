import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SoundStudioTabs } from "./component/tabs.component";
import { TtsComponent } from "./component/tts/tts.component";
import { AsrComponent } from "./component/asr/asr.component";
import { GenerationComponent } from "./component/generation/generation.component";
import { SoundComponent } from "./component/sound/sound.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: "",
        component: SoundStudioTabs,
        children: [
          { path: "", redirectTo: "tts", pathMatch: "full" },
          { path: "tts", component: TtsComponent },
          { path: "asr", component: AsrComponent },
          { path: "generation", component: SoundComponent },
        ],
      },
    ]),
  ],
  exports: [RouterModule],
})
export class SoundStudioRoutingModule {}
