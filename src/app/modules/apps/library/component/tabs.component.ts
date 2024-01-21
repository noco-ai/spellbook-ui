import { Component, OnDestroy, OnInit } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router, NavigationEnd } from "@angular/router";
import { ConfirmationService, MessageService, MenuItem } from "primeng/api";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";

@Component({
  templateUrl: "./tabs.component.html",
  providers: [ConfirmationService, MessageService],
})
export class LibraryTabs implements OnInit, OnDestroy {
  routeItems: MenuItem[] = [];
  private routerSubscription!: Subscription;

  constructor(private layoutService: LayoutService, private router: Router) {}

  ngOnInit() {
    this.updateMenuItems();

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateMenuItems();
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateMenuItems() {
    const check = ["book", "analysis"];
    if (
      this.router.url.includes("qa") ||
      this.router.url.includes("book") ||
      this.router.url.includes("analyze") ||
      this.router.url.includes("locations") ||
      this.router.url.includes("characters") ||
      this.router.url.includes("summary")
    ) {
      const url = this.router.url.split("/");
      this.routeItems = [
        { label: "View", routerLink: `book/${url[url.length - 1]}` },
        {
          label: "Characters",
          routerLink: `characters/${url[url.length - 1]}`,
        },
        { label: "Locations", routerLink: `locations/${url[url.length - 1]}` },
        { label: "Q/A", routerLink: `qa/${url[url.length - 1]}` },
        { label: "Summary", routerLink: `summary/${url[url.length - 1]}` },
        { label: "AI Analysis", routerLink: `analyze/${url[url.length - 1]}` },
        {
          label: "Back to Books",
          routerLink: "fiction",
          icon: "pi pi-directions-alt",
        },
      ];
    } else {
      this.routeItems = [
        { label: "Fiction", routerLink: "fiction" },
        { label: "Non-fiction", routerLink: "non-fiction" },
      ];
    }
  }
}
