import { Component, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MenuService } from '../service/app.menu.service';
import { AppSidebarComponent } from './sidebar/sidebar.component';
import { AppTopbarComponent } from './topbar/topbar.component';
import { LayoutService } from '../service/app.layout.service';

@Component({
    selector: 'app-layout',
    templateUrl: './app.layout.component.html',
})
export class AppLayoutComponent implements OnDestroy {
    overlayMenuOpenSubscription: Subscription;

    menuOutsideClickListener: any;

    menuScrollListener: any;

    @ViewChild(AppSidebarComponent) appSidebar!: AppSidebarComponent;

    @ViewChild(AppTopbarComponent) appTopbar!: AppTopbarComponent;

    constructor(
        private menuService: MenuService,
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router
    ) {
        this.overlayMenuOpenSubscription =
            this.layoutService.overlayOpen$.subscribe(() => {
                if (!this.menuOutsideClickListener) {
                    this.menuOutsideClickListener = this.renderer.listen(
                        'document',
                        'click',
                        (event) => {
                            const isOutsideClicked = !(
                                this.appSidebar.el.nativeElement.isSameNode(
                                    event.target
                                ) ||
                                this.appSidebar.el.nativeElement.contains(
                                    event.target
                                ) ||
                                this.appTopbar.menuButton.nativeElement.isSameNode(
                                    event.target
                                ) ||
                                this.appTopbar.menuButton.nativeElement.contains(
                                    event.target
                                )
                            );
                            if (isOutsideClicked) {
                                this.hideMenu();
                            }
                        }
                    );
                }

                if (
                    (this.layoutService.isHorizontal() ||
                        this.layoutService.isSlim() ||
                        this.layoutService.isSlimPlus()) &&
                    !this.menuScrollListener
                ) {
                    this.menuScrollListener = this.renderer.listen(
                        this.appSidebar.menuContainer.nativeElement,
                        'scroll',
                        (event) => {
                            if (this.layoutService.isDesktop()) {
                                this.hideMenu();
                            }
                        }
                    );
                }

                if (this.layoutService.state.staticMenuMobileActive) {
                    this.blockBodyScroll();
                }
            });

        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => {
                this.hideMenu();
            });
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(
                new RegExp(
                    '(^|\\b)' +
                        'blocked-scroll'.split(' ').join('|') +
                        '(\\b|$)',
                    'gi'
                ),
                ' '
            );
        }
    }

    hideMenu() {
        this.layoutService.state.overlayMenuActive = false;
        this.layoutService.state.staticMenuMobileActive = false;
        this.layoutService.state.menuHoverActive = false;
        this.menuService.reset();

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }

        if (this.menuScrollListener) {
            this.menuScrollListener();
            this.menuScrollListener = null;
        }

        this.unblockBodyScroll();
    }

    get containerClass() {
        return {
            'layout-light': this.layoutService.config.colorScheme === 'light',
            'layout-dim': this.layoutService.config.colorScheme === 'dim',
            'layout-dark': this.layoutService.config.colorScheme === 'dark',
            'layout-colorscheme-menu':
                this.layoutService.config.menuTheme === 'colorScheme',
            'layout-primarycolor-menu':
                this.layoutService.config.menuTheme === 'primaryColor',
            'layout-transparent-menu':
                this.layoutService.config.menuTheme === 'transparent',
            'layout-overlay': this.layoutService.config.menuMode === 'overlay',
            'layout-static': this.layoutService.config.menuMode === 'static',
            'layout-slim': this.layoutService.config.menuMode === 'slim',
            'layout-slim-plus':
                this.layoutService.config.menuMode === 'slim-plus',
            'layout-horizontal':
                this.layoutService.config.menuMode === 'horizontal',
            'layout-reveal': this.layoutService.config.menuMode === 'reveal',
            'layout-drawer': this.layoutService.config.menuMode === 'drawer',
            'layout-static-inactive':
                this.layoutService.state.staticMenuDesktopInactive &&
                this.layoutService.config.menuMode === 'static',
            'layout-overlay-active': this.layoutService.state.overlayMenuActive,
            'layout-mobile-active':
                this.layoutService.state.staticMenuMobileActive,
            'p-input-filled': this.layoutService.config.inputStyle === 'filled',
            'p-ripple-disabled': !this.layoutService.config.ripple,
            'layout-sidebar-active': this.layoutService.state.sidebarActive,
            'layout-sidebar-anchored': this.layoutService.state.anchored,
        };
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
