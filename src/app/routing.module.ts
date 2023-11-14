import { NgModule } from "@angular/core";
import { ExtraOptions, RouterModule, Routes, Router } from "@angular/router";
import { routes } from "./routes.config";

const routerOptions: ExtraOptions = {
  anchorScrolling: "enabled",
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule],
})
export class RoutingModule {}
