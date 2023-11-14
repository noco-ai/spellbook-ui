import { Component, OnDestroy, OnInit, AfterViewChecked } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router } from "@angular/router";

@Component({
  templateUrl: "./chat-ability.component.html",
})
export class AppManagerChatAbilities implements OnInit, OnDestroy {
  constructor(private layoutService: LayoutService, private router: Router) {}

  ngOnDestroy() {}

  ngOnInit() {}

  appUpdated(event: any) {}
}
