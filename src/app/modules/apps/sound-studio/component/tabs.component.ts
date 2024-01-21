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
export class SoundStudioTabs implements OnInit, OnDestroy {
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
    this.routeItems = [
      { label: "Text to Speech", routerLink: "tts" },
      { label: "Speech Recognition", routerLink: "asr" },
      { label: "Music Generation", routerLink: "generation" },
    ];
  }
}
