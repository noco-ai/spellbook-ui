import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { UnauthorizedComponent } from "./component/unauthorized.component";

@NgModule({
  imports: [
    RouterModule.forChild([{ path: "", component: UnauthorizedComponent }]),
  ],
  exports: [RouterModule],
})
export class UnauthorizedRoutingModule {}
