import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { SocketService } from "src/app/service/sockets.service";

export type MenuMode =
  | "static"
  | "overlay"
  | "horizontal"
  | "slim"
  | "slim-plus"
  | "reveal"
  | "drawer";

export type ColorScheme = "light" | "dark" | "dim";

export type MenuColorScheme = "colorScheme" | "primaryColor" | "transparent";

export interface AppConfig {
  inputStyle: string;
  colorScheme: ColorScheme;
  theme: string;
  ripple: boolean;
  menuMode: MenuMode;
  scale: number;
  menuTheme: MenuColorScheme;
  spellLabels: boolean;
}

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  profileSidebarVisible: boolean;
  configSidebarVisible: boolean;
  staticMenuMobileActive: boolean;
  menuHoverActive: boolean;
  sidebarActive: boolean;
  anchored: boolean;
}

@Injectable({
  providedIn: "root",
})
export class LayoutService {
  config: AppConfig = {
    ripple: false,
    inputStyle: "outlined",
    menuMode: "static",
    colorScheme: "light",
    theme: "indigo",
    scale: 14,
    menuTheme: "colorScheme",
    spellLabels: false,
  };

  state: LayoutState = {
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    sidebarActive: false,
    anchored: false,
  };

  constructor(
    private socketService: SocketService,
  ) {}

  private configUpdate = new Subject<AppConfig>();

  private overlayOpen = new Subject<any>();

  configUpdate$ = this.configUpdate.asObservable();

  overlayOpen$ = this.overlayOpen.asObservable();

  onMenuToggle() {
    if (this.isOverlay()) {
      this.state.overlayMenuActive = !this.state.overlayMenuActive;

      if (this.state.overlayMenuActive) {
        this.overlayOpen.next(null);
      }
    }

    if (this.isDesktop()) {
      this.state.staticMenuDesktopInactive =
        !this.state.staticMenuDesktopInactive;
    } else {
      this.state.staticMenuMobileActive = !this.state.staticMenuMobileActive;

      if (this.state.staticMenuMobileActive) {
        this.overlayOpen.next(null);
      }
    }
  }

  onOverlaySubmenuOpen() {
    this.overlayOpen.next(null);
  }

  showProfileSidebar() {
    this.state.profileSidebarVisible = true;
  }

  showConfigSidebar() {
    this.state.configSidebarVisible = true;
  }

  isOverlay() {
    return this.config.menuMode === "overlay";
  }

  isDesktop() {
    return window.innerWidth > 991;
  }

  isSlim() {
    return this.config.menuMode === "slim";
  }

  isSlimPlus() {
    return this.config.menuMode === "slim-plus";
  }

  isHorizontal() {
    return this.config.menuMode === "horizontal";
  }

  isMobile() {
    return !this.isDesktop();
  }

  onConfigUpdate() {
    this.saveConfig();
    this.configUpdate.next(this.config);
  }

  saveConfig() {
    window.localStorage.setItem("theme", JSON.stringify(this.config));
    this.socketService.send("command", {
      command: "get_menu",
      spell_labels: this.config.spellLabels,
    });
    this.socketService.send("command", {
      command: "get_spell_list",
      spell_labels: this.config.spellLabels,
    });
  }

  replaceThemeLink(href: any, onComplete: Function) {
    const id = "theme-link";
    const themeLink = <HTMLLinkElement>document.getElementById(id);
    const cloneLinkElement = <HTMLLinkElement>themeLink.cloneNode(true);

    cloneLinkElement.setAttribute("href", href);
    cloneLinkElement.setAttribute("id", id + "-clone");

    themeLink.parentNode!.insertBefore(cloneLinkElement, themeLink.nextSibling);

    cloneLinkElement.addEventListener("load", () => {
      themeLink.remove();
      cloneLinkElement.setAttribute("id", id);
      onComplete();
    });
  }
}
