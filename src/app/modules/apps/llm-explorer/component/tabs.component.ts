import { Component, OnDestroy, OnInit, AfterViewChecked } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { MenuItem } from "primeng/api";

@Component({
  templateUrl: "./tabs.component.html",
  providers: [ConfirmationService, MessageService],
})
export class LlmExplorerTabs implements OnInit, OnDestroy {
  routeItems: MenuItem[] = [];

  constructor(private layoutService: LayoutService, private router: Router) {}

  ngOnDestroy() {}

  ngOnInit() {
    this.routeItems = [
      { label: "Chat", routerLink: "chat" },
      { label: "Completion", routerLink: "completion" },
    ];
  }
}
