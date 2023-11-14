import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { SettingsService } from "../service/app-settings.service";
import { Subscription } from "rxjs";
import { Spell } from "../api/spell";
import { DomSanitizer } from "@angular/platform-browser";
import { LayoutService } from "src/app/layout/service/app.layout.service";

@Component({
  templateUrl: "./app-setting.component.html",
  styleUrls: ["./app-setting.component.scss"],
})
export class AppSettingComponent implements OnInit, OnDestroy {
  serverUpdates!: Subscription;
  useSpellLabels: boolean = false;
  activeSpell: Spell = {
    label: "None",
    spell_label: "None",
    description: "",
    card: "",
    icon: "",
    module: "",
    configuration: {},
    skill_dependencies: [],
    skill_status: [],
  };
  baseIconUrl!: string;
  showConfigureSpellDialog: boolean = false;
  canConfigureSpell: boolean = false;
  spellConfigurationTemplate = {};
  spellConfigurationData = {};
  configSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private settingsService: SettingsService,
    private sanitizer: DomSanitizer,
    private layoutService: LayoutService
  ) {}

  configureSpellSubmit() {
    this.showConfigureSpellDialog = false;
  }

  configureSpell(spell: Spell) {
    this.settingsService.getConfiguration(spell.configuration);
  }

  allowHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  ngOnInit() {
    this.settingsService.getSpellList();
    this.baseIconUrl = this.settingsService.getSocketUrl();

    this.useSpellLabels = this.layoutService.config.spellLabels;
    this.configSubscription = this.settingsService.spellConfiguration.subscribe(
      (configuration) => {
        this.spellConfigurationData = configuration ? configuration : {};
        this.spellConfigurationTemplate = this.activeSpell.configuration;
        this.showConfigureSpellDialog = true;
      }
    );

    this.serverUpdates = this.settingsService.spellList.subscribe(
      (data: Array<Spell>) => {
        this.route.paramMap.subscribe((params) => {
          const namespace = params.get("namespace");
          const module = params.get("module");
          for (let i = 0; i < data.length; i++) {
            const currentSpell = data[i];
            if (currentSpell.module == `${namespace}/${module}`) {
              this.activeSpell = currentSpell;
              this.canConfigureSpell = this.activeSpell.configuration
                ? true
                : false;
              break;
            }
          }
        });
      }
    );
  }

  ngOnDestroy() {
    this.configSubscription.unsubscribe();
    this.serverUpdates.unsubscribe();
  }
}
