import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { ToastModule } from "primeng/toast";
import { MultiSelectModule } from "primeng/multiselect";
import { SliderModule } from "primeng/slider";
import { InputTextModule } from "primeng/inputtext";
import { ImageGeneratorComponent } from "./component/image-generator.component";
import { ImageGeneratorRoutingModule } from "./image-generator.routing.module";
import { AccordionModule } from "primeng/accordion";
import { GalleriaModule } from "primeng/galleria";
import { ProgressBarModule } from "primeng/progressbar";
import { InputSwitch, InputSwitchModule } from "primeng/inputswitch";

@NgModule({
  imports: [
    CommonModule,
    ImageGeneratorRoutingModule,
    AccordionModule,
    ToastModule,
    FormsModule,
    ConfirmPopupModule,
    ButtonModule,
    ProgressBarModule,
    MultiSelectModule,
    SliderModule,
    GalleriaModule,
    InputTextModule,
    InputSwitchModule,
  ],
  declarations: [ImageGeneratorComponent],
})
export class ImageGeneratorModule {}
