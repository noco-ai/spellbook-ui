import { Injectable, EventEmitter } from "@angular/core";
import { SocketService } from "src/app/service/sockets.service";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Spell } from "../api/spell";
import { Uses } from "../../servers/api/uses";

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  spellList: EventEmitter<Spell> = new EventEmitter<Spell>();
  uses: EventEmitter<Uses[]> = new EventEmitter<Uses[]>();
  spellConfiguration: EventEmitter<any> = new EventEmitter<any>();
  usesCache: Uses[] = [];

  constructor(
    private socketService: SocketService,
    private layoutService: LayoutService
  ) {
    this.socketService.subscribeToEvent("spell_list", (spells: Spell) => {
      this.spellList.emit(spells);
    });

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_configuration",
      (data) => {
        this.spellConfiguration.emit(data.configuration);
      }
    );
  }

  getConfiguration(template: any) {
    this.socketService.send("command", {
      command: "get_configuration",
      payload: template,
    });
  }

  getSocketUrl() {
    return this.socketService.getBaseUrl();
  }

  getSpellList() {
    this.socketService.send("command", {
      command: "get_spell_list",
      spell_labels: this.layoutService.config.spellLabels,
    });
  }
}
