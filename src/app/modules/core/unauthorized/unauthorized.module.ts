import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { UnauthorizedRoutingModule } from "./unauthorized-routing.module";
import { UnauthorizedComponent } from "./component/unauthorized.component";

@NgModule({
  imports: [CommonModule, UnauthorizedRoutingModule, ButtonModule],
  declarations: [UnauthorizedComponent],
})
export class UnauthorizedModule {}
