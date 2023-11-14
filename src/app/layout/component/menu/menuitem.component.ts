import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import {
  animate,
  state,
  style,
  transition,
  trigger,
  AnimationEvent,
} from "@angular/animations";
import { Subscription, fromEvent } from "rxjs";
import { filter } from "rxjs/operators";
import { MenuService } from "../../service/app.menu.service";
import { LayoutService } from "../../service/app.layout.service";
import { AppSidebarComponent } from "../sidebar/sidebar.component";
import { DomHandler } from "primeng/dom";
import { delay, takeUntil } from "rxjs/operators";

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "[app-menuitem]",
  template: `
    <ng-container>
      <div
        *ngIf="root && item.visible !== false"
        class="layout-menuitem-root-text"
      >
        {{ item.label }}
      </div>
      <a
        *ngIf="(!item.routerLink || item.items) && item.visible !== false"
        [attr.href]="item.url"
        (click)="itemClick($event)"
        (mouseenter)="onMouseEnter()"
        [ngClass]="item.class"
        [attr.target]="item.target"
        tabindex="0"
        pRipple
        [pTooltip]="item.label"
        [tooltipDisabled]="!(isSlim && root && !active)"
      >
        <i [ngClass]="item.icon" class="layout-menuitem-icon"></i>
        <span [ngClass]="item.style" class="layout-menuitem-text">{{
          item.label
        }}</span>
        <i
          class="pi pi-fw pi-angle-down layout-submenu-toggler"
          *ngIf="item.items"
        ></i>
      </a>
      <a
        *ngIf="item.routerLink && !item.items && item.visible !== false"
        #dblclick
        (mouseenter)="onMouseEnter()"
        [ngClass]="item.class"
        routerLinkActive="active-route"
        [routerLinkActiveOptions]="
          item.routerLinkActiveOptions || {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored'
          }
        "
        [attr.target]="item.target"
        tabindex="0"
        pRipple
        [pTooltip]="item.label"
        [tooltipDisabled]="!(isSlim && root)"
      >
        <i [ngClass]="item.icon" class="layout-menuitem-icon"></i>
        <span [ngClass]="item.style" class="layout-menuitem-text">{{
          item.label
        }}</span>
        <i
          class="pi pi-fw pi-angle-down layout-submenu-toggler"
          *ngIf="item.items"
        ></i>
      </a>

      <ul
        #submenu
        *ngIf="item.items && item.visible !== false"
        [@children]="submenuAnimation"
        (@children.done)="onSubmenuAnimated($event)"
      >
        <ng-template ngFor let-child let-i="index" [ngForOf]="item.items">
          <li
            app-menuitem
            [item]="child"
            [index]="i"
            [parentKey]="key"
            [class]="child.badgeClass"
          ></li>
        </ng-template>
      </ul>
    </ng-container>
  `,
  animations: [
    trigger("children", [
      state(
        "collapsed",
        style({
          height: "0",
        })
      ),
      state(
        "expanded",
        style({
          height: "*",
        })
      ),
      state(
        "hidden",
        style({
          display: "none",
        })
      ),
      state(
        "visible",
        style({
          display: "block",
        })
      ),
      transition(
        "collapsed <=> expanded",
        animate("400ms cubic-bezier(0.86, 0, 0.07, 1)")
      ),
    ]),
  ],
  styleUrls: ["./menu.component.scss"],
})
export class AppMenuitemComponent implements OnInit, OnDestroy {
  @Input() item: any;

  @Input() index!: number;

  @Input() @HostBinding("class.layout-root-menuitem") root!: boolean;

  @Input() parentKey!: string;

  @ViewChild("submenu") submenu!: ElementRef;

  active = false;

  menuSourceSubscription: Subscription;

  menuResetSubscription: Subscription;

  key: string = "";

  @ViewChild("dblclick") doubleClick!: ElementRef;

  ngAfterViewInit() {
    if (!this.doubleClick) {
      return;
    }
    const dblclick$ = fromEvent(this.doubleClick.nativeElement, "dblclick");
    const getClick$ = () =>
      fromEvent(this.doubleClick.nativeElement, "click").pipe(
        delay(250),
        takeUntil(dblclick$)
      );

    let clickSubscription: any;

    const subscribeToClick$ = () => {
      clickSubscription = getClick$().subscribe((event: any) => {
        this.itemClick(event, this.item.routerLink);
      });
    };
    subscribeToClick$();

    dblclick$.subscribe((event: any) => {
      clickSubscription.unsubscribe();
      subscribeToClick$();
      if (!this.item.settings_link) {
        return this.itemClick(event, this.item.routerLink);
      }
      return this.itemClick(event, `settings/${this.item.settings_link}`);
    });
  }

  constructor(
    public layoutService: LayoutService,
    private cd: ChangeDetectorRef,
    public router: Router,
    private appSidebar: AppSidebarComponent,
    private menuService: MenuService
  ) {
    this.menuSourceSubscription = this.menuService.menuSource$.subscribe(
      (value) => {
        Promise.resolve(null).then(() => {
          if (value.routeEvent) {
            this.active =
              value.key === this.key || value.key.startsWith(this.key + "-")
                ? true
                : false;
          } else {
            if (
              value.key !== this.key &&
              !value.key.startsWith(this.key + "-")
            ) {
              this.active = false;
            }
          }
        });
      }
    );

    this.menuResetSubscription = this.menuService.resetSource$.subscribe(() => {
      this.active = false;
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((params) => {
        if (this.isSlimPlus || this.isSlim || this.isHorizontal) {
          this.active = false;
        } else {
          if (this.item.routerLink) {
            this.updateActiveStateFromRoute();
          }
        }
      });
  }

  ngOnInit() {
    this.key = this.parentKey
      ? this.parentKey + "-" + this.index
      : String(this.index);

    if (
      !(this.isSlimPlus || this.isSlim || this.isHorizontal) &&
      this.item.routerLink
    ) {
      this.updateActiveStateFromRoute();
    }
  }

  ngAfterViewChecked() {
    if (
      this.root &&
      this.active &&
      this.layoutService.isDesktop() &&
      (this.layoutService.isHorizontal() ||
        this.layoutService.isSlim() ||
        this.layoutService.isSlimPlus())
    ) {
      this.calculatePosition(
        this.submenu?.nativeElement,
        this.submenu?.nativeElement.parentElement
      );
    }
  }

  updateActiveStateFromRoute() {
    let activeRoute = this.router.isActive(this.item.routerLink[0], {
      paths: "exact",
      queryParams: "ignored",
      matrixParams: "ignored",
      fragment: "ignored",
    });

    if (activeRoute) {
      this.menuService.onMenuStateChange({
        key: this.key,
        routeEvent: true,
      });
    }
  }

  onSubmenuAnimated(event: AnimationEvent) {
    if (
      event.toState === "visible" &&
      this.layoutService.isDesktop() &&
      (this.layoutService.isHorizontal() ||
        this.layoutService.isSlim() ||
        this.layoutService.isSlimPlus())
    ) {
      const el = <HTMLUListElement>event.element;
      const elParent = <HTMLUListElement>el.parentElement;
      this.calculatePosition(el, elParent);
    }
  }

  calculatePosition(overlay: HTMLElement, target: HTMLElement) {
    if (overlay) {
      const { left, top } = target.getBoundingClientRect();
      const [vWidth, vHeight] = [window.innerWidth, window.innerHeight];
      const [oWidth, oHeight] = [overlay.offsetWidth, overlay.offsetHeight];
      const scrollbarWidth = DomHandler.calculateScrollbarWidth();
      // reset
      overlay.style.top = "";
      overlay.style.left = "";

      if (this.layoutService.isHorizontal()) {
        const width = left + oWidth + scrollbarWidth;
        overlay.style.left =
          vWidth < width ? `${left - (width - vWidth)}px` : `${left}px`;
      } else if (
        this.layoutService.isSlim() ||
        this.layoutService.isSlimPlus()
      ) {
        const height = top + oHeight;
        overlay.style.top =
          vHeight < height ? `${top - (height - vHeight)}px` : `${top}px`;
      }
    }
  }

  itemClick(event: Event, routerLink: string | null = null) {
    if (routerLink) {
      this.router.navigate([routerLink]);
      event.preventDefault();
    }

    // avoid processing disabled items
    if (this.item.disabled) {
      event.preventDefault();
      return;
    }

    // navigate with hover
    if ((this.root && this.isSlim) || this.isHorizontal || this.isSlimPlus) {
      this.layoutService.state.menuHoverActive =
        !this.layoutService.state.menuHoverActive;
    }

    // how theme config
    if (this.item.routerLink === "configuration/theme") {
      this.layoutService.showConfigSidebar();
      event.preventDefault();
      return;
    }
    // execute command
    else if (this.item.command) {
      this.item.command({ originalEvent: event, item: this.item });
    }

    // toggle active state
    if (this.item.items) {
      this.active = !this.active;

      if (
        this.root &&
        this.active &&
        (this.isSlim || this.isHorizontal || this.isSlimPlus)
      ) {
        this.layoutService.onOverlaySubmenuOpen();
      }
    } else {
      if (this.layoutService.isMobile()) {
        this.layoutService.state.staticMenuMobileActive = false;
      }

      if (this.isSlim || this.isHorizontal || this.isSlimPlus) {
        this.menuService.reset();
        this.layoutService.state.menuHoverActive = false;
      }
    }

    this.menuService.onMenuStateChange({ key: this.key });
  }

  onMouseEnter() {
    // activate item on hover
    if (
      this.root &&
      (this.isSlim || this.isHorizontal || this.isSlimPlus) &&
      this.layoutService.isDesktop()
    ) {
      if (this.layoutService.state.menuHoverActive) {
        this.active = true;
        this.menuService.onMenuStateChange({ key: this.key });
      }
    }
  }

  get submenuAnimation() {
    if (
      this.layoutService.isDesktop() &&
      (this.layoutService.isHorizontal() ||
        this.layoutService.isSlim() ||
        this.layoutService.isSlimPlus())
    ) {
      return this.active ? "visible" : "hidden";
    } else
      return this.root ? "expanded" : this.active ? "expanded" : "collapsed";
  }

  get isHorizontal() {
    return this.layoutService.isHorizontal();
  }

  get isSlim() {
    return this.layoutService.isSlim();
  }

  get isSlimPlus() {
    return this.layoutService.isSlimPlus();
  }

  @HostBinding("class.active-menuitem")
  get activeClass() {
    return this.active && !this.root;
  }

  ngOnDestroy() {
    if (this.menuSourceSubscription) {
      this.menuSourceSubscription.unsubscribe();
    }

    if (this.menuResetSubscription) {
      this.menuResetSubscription.unsubscribe();
    }
  }
}
