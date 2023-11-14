import { Injectable, EventEmitter } from "@angular/core";
import { SocketService } from "src/app/service/sockets.service";
import { Server } from "../../servers/api/server";
import { LayoutService } from "src/app/layout/service/app.layout.service";

@Injectable({
  providedIn: "root",
})
export class AppManagerService {
  servers: EventEmitter<Server> = new EventEmitter<Server>();
  apps: EventEmitter<any> = new EventEmitter<any>();
 
  constructor(
    private socketService: SocketService,
    private layoutService: LayoutService
  ) {
    this.socketService.subscribeToEvent("system_info", (server: Server) => {
      this.servers.emit(server);
    });

    this.socketService.subscribeToEvent("spell_list", (data: any) => {
      this.apps.emit(data);
    });

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "update_module",
      (data) => {
        this.getApps();
        this.socketService.send("command", {
          command: "get_menu",
          spell_labels: layoutService.config.spellLabels,
        });
      }
    );
  }

  getServers() {
    this.socketService.send("command", {
      command: "worker_report",
    });
  }

  getApps() {
    this.socketService.send("command", {
      command: "get_spell_list",
      spell_labels: this.layoutService.config.spellLabels,
    });
  }

  updateApp(app: any) {
    this.socketService.send("command", {
      command: "update_module",
      module: app.unique_key,
      is_installed: app.is_installed,
    });
  }

  getSocketUrl() {
    return this.socketService.getBaseUrl();
  }
}
