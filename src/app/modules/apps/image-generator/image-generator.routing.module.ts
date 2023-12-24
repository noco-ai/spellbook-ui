import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ImageGeneratorComponent } from "./component/image-generator.component";

@NgModule({
  imports: [
    RouterModule.forChild([{ path: "", component: ImageGeneratorComponent }]),
  ],
  exports: [RouterModule],
})
export class ImageGeneratorRoutingModule {}
