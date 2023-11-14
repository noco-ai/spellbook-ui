import { Component, OnDestroy, OnInit, AfterViewChecked } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router } from "@angular/router";
import { ConfirmationService, MessageService } from "primeng/api";
import { MenuItem } from "primeng/api";

@Component({
  templateUrl: "./main-page.component.html",
  providers: [ConfirmationService, MessageService],
})
export class AppManagerMain implements OnInit, OnDestroy {
  routeItems: MenuItem[] = [];

  constructor(
    private layoutService: LayoutService,
    private router: Router //private serversService: ServersService, //private sanitizer: DomSanitizer, //private confirmationService: ConfirmationService, //private messageService: MessageService
  ) {}

  ngOnDestroy() {}

  ngOnInit() {
    this.routeItems = [
      { label: "Applications", routerLink: "applications" },
      { label: "Chat Abilities", routerLink: "chat-abilities" },
    ];
  }
}
