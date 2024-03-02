import { Component, OnDestroy, OnInit } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router, NavigationEnd } from "@angular/router";
import { ConfirmationService, MessageService, MenuItem } from "primeng/api";
import { Subscription } from "rxjs";

@Component({
  templateUrl: "./non-fiction.component.html",
  providers: [ConfirmationService, MessageService],
})
export class LibraryNonfictionComponent implements OnInit, OnDestroy {
  routeItems: MenuItem[] = [];
  private routerSubscription!: Subscription;

  constructor(private layoutService: LayoutService, private router: Router) {}

  ngOnInit() {}

  ngOnDestroy() {}
}
