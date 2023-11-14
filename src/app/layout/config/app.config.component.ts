import { Component, Input, OnInit } from "@angular/core";
import { MenuService } from "../service/app.menu.service";
import {
  ColorScheme,
  LayoutService,
  MenuColorScheme,
  MenuMode,
} from "../service/app.layout.service";

@Component({
  selector: "app-config",
  templateUrl: "./app.config.component.html",
})
export class AppConfigComponent implements OnInit {
  @Input() minimal: boolean = false;

  componentThemes: any[] = [];

  scales: number[] = [12, 13, 14, 15, 16];

  constructor(
    public layoutService: LayoutService,
    public menuService: MenuService
  ) {}

  get visible(): boolean {
    return this.layoutService.state.configSidebarVisible;
  }

  set visible(_val: boolean) {
    this.layoutService.state.configSidebarVisible = _val;
  }

  get scale(): number {
    return this.layoutService.config.scale;
  }

  set scale(_val: number) {
    this.layoutService.config.scale = _val;
  }

  get menuMode(): MenuMode {
    return this.layoutService.config.menuMode;
  }

  set menuMode(_val: MenuMode) {
    this.layoutService.config.menuMode = _val;
    if (
      this.layoutService.isSlimPlus() ||
      this.layoutService.isSlim() ||
      this.layoutService.isHorizontal()
    ) {
      this.menuService.reset();
    }
    this.layoutService.saveConfig();
  }

  get spellLabels(): boolean {
    return this.layoutService.config.spellLabels;
  }

  set spellLabels(_val: boolean) {
    this.layoutService.config.spellLabels = _val;
    this.layoutService.saveConfig();
  }

  get colorScheme(): ColorScheme {
    return this.layoutService.config.colorScheme;
  }

  set colorScheme(_val: ColorScheme) {
    this.changeColorScheme(_val);
  }

  get inputStyle(): string {
    return this.layoutService.config.inputStyle;
  }

  set inputStyle(_val: string) {
    this.layoutService.config.inputStyle = _val;
    this.layoutService.saveConfig();
  }

  get ripple(): boolean {
    return this.layoutService.config.ripple;
  }

  set ripple(_val: boolean) {
    this.layoutService.config.ripple = _val;
    this.layoutService.saveConfig();
  }

  get menuTheme(): MenuColorScheme {
    return this.layoutService.config.menuTheme;
  }

  set menuTheme(_val: MenuColorScheme) {
    this.layoutService.config.menuTheme = _val;
    this.layoutService.saveConfig();
  }

  ngOnInit() {
    this.componentThemes = [
      { name: "indigo", color: "#6366F1" },
      { name: "blue", color: "#3B82F6" },
      { name: "purple", color: "#8B5CF6" },
      { name: "teal", color: "#14B8A6" },
      { name: "cyan", color: "#06b6d4" },
      { name: "green", color: "#10b981" },
      { name: "orange", color: "#f59e0b" },
      { name: "pink", color: "#d946ef" },
    ];
  }

  changeColorScheme(colorScheme: ColorScheme) {
    const themeLink = <HTMLLinkElement>document.getElementById("theme-link");
    const themeLinkHref = themeLink.getAttribute("href");
    const currentColorScheme = "theme-" + this.layoutService.config.colorScheme;
    const newColorScheme = "theme-" + colorScheme;
    const newHref = themeLinkHref!.replace(currentColorScheme, newColorScheme);
    this.layoutService.replaceThemeLink(newHref, () => {
      this.layoutService.config.colorScheme = colorScheme;
      this.layoutService.onConfigUpdate();
    });
  }

  changeTheme(theme: string) {
    const themeLink = <HTMLLinkElement>document.getElementById("theme-link");
    const newHref = themeLink
      .getAttribute("href")!
      .replace(this.layoutService.config.theme, theme);
    this.layoutService.replaceThemeLink(newHref, () => {
      this.layoutService.config.theme = theme;
      this.layoutService.onConfigUpdate();
    });
  }

  decrementScale() {
    this.scale--;
    this.applyScale();
  }

  incrementScale() {
    this.scale++;
    this.applyScale();
  }

  applyScale() {
    document.documentElement.style.fontSize = this.scale + "px";
  }
}
