import { Injectable, EventEmitter } from "@angular/core";
import { SocketService } from "src/app/service/sockets.service";
import { Server } from "../api/server";
import { Uses } from "../api/uses";
import { LayoutService } from "src/app/layout/service/app.layout.service";

@Injectable({
  providedIn: "root",
})
export class ServersService {
  servers: EventEmitter<Server> = new EventEmitter<Server>();
  uses: EventEmitter<Uses[]> = new EventEmitter<Uses[]>();
  skillConfiguration: EventEmitter<any> = new EventEmitter<any>();
  usesCache: Uses[] = [];

  constructor(
    private socketService: SocketService,
    private layoutService: LayoutService
  ) {
    this.socketService.subscribeToEvent("system_info", (server: Server) => {
      if (!this.usesCache.length) {
        const uses = this.getUniqueUses(server.installed_skills);
        this.usesCache = uses.map((use) => ({
          name: use
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          code: use,
        }));
        this.usesCache.push({
          name: "Third Party Api",
          code: "third_party_api",
        });
      }
      this.uses.emit(this.usesCache);
      this.servers.emit(server);
      // updates menu after a skill starts or stops
      this.socketService.send("command", {
        command: "get_menu",
        spell_labels: this.layoutService.config.spellLabels,
      });
    });

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_configuration",
      (data) => {
        this.skillConfiguration.emit(data.configuration);
      }
    );
  }

  private getUniqueUses(dataArray: any[]): string[] {
    const allUses = dataArray.reduce((uses: string[], item: any) => {
      return uses.concat(item.use);
    }, []);

    return Array.from(new Set(allUses));
  }

  stopSkill(payload: any) {
    this.socketService.send("command", {
      command: "stop_skill",
      payload: payload,
    });
  }

  createCustomSkill(skillDefinition: any) {
    this.socketService.send("command", {
      command: "custom_skill",
      skill: skillDefinition,
    });
  }

  runSkill(payload: any) {
    this.socketService.send("command", {
      command: "run_skill",
      payload: payload,
    });
  }

  installSkill(skillDefinition: any) {
    this.socketService.send("command", {
      command: "install_skill",
      payload: skillDefinition,
    });
  }

  getConfiguration(template: any) {
    this.socketService.send("command", {
      command: "get_configuration",
      payload: template,
    });
  }

  getServers() {
    console.log("get servers");
    this.socketService.send("command", {
      command: "worker_report",
    });
  }

  isSkillInstalled(skill: any, memUsage: string, serverData: Server) {
    let installed = true;
    let downloading = false;
    if (skill.model) {
      for (let j = 0; j < skill.model.length; j++) {
        const model = skill.model[j];
        let modelName =
          model.files && model.files[memUsage]
            ? `${model.name}/${model.files[memUsage]}`
            : model.name;
        if (model.branch && model.branch[memUsage])
          modelName = `${model.name}/${model.branch[memUsage]}`;

        if (serverData.downloading_models.includes(modelName)) {
          downloading = true;
        }
        if (!serverData.installed_models.includes(modelName)) {
          installed = false;
        }
      }
    }

    if (skill.repository) {
      for (let j = 0; j < skill.repository.length; j++) {
        const repository = skill.repository[j];
        if (!serverData.installed_repository.includes(repository.folder)) {
          installed = false;
          break;
        }
      }
    }
    return { installed: installed, downloading: downloading };
  }

  convertBytes(bytes: number, base: number = 1024) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) {
      return { value: 0, unit: sizes[0], raw: 0 };
    }
    const i = Math.floor(Math.log(bytes) / Math.log(base));
    return {
      value: parseFloat((bytes / Math.pow(base, i)).toFixed(2)),
      unit: sizes[i],
      raw: bytes,
    };
  }

  determineSeverity(status: string): string {
    let severity = "info";
    switch (status) {
      case "STARTING":
      case "STOPPING":
        severity = "warning";
        break;
      case "ONLINE":
        severity = "success";
        break;
      case "ERROR":
        severity = "danger";
        break;
    }
    return severity;
  }
}
