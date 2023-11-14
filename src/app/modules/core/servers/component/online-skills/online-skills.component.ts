import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { ConfirmationService, MessageService } from "primeng/api";
import { Server } from "../../api/server";
import { ServersService } from "../../service/servers.service";

interface expandedRows {
  [key: string]: boolean;
}

@Component({
  selector: "online-skills",
  templateUrl: "./online-skills.component.html",
  styleUrls: ["../servers.component.scss"],
  providers: [ConfirmationService, MessageService],
})
export class OnlineSkills implements OnInit, OnDestroy {
  serverUpdates!: Subscription;
  servers: Server[] = [];
  skills: any[] = [];
  uses: any[] = [];
  isExpanded: boolean = false;
  expandedRows: expandedRows = {};
  showRunSkillDialog: boolean = false;
  showConfigureSkillDialog: boolean = false;

  currentRunSkill: any;
  runSkillDeviceOptions: any[] = [];
  runSkillSelectedDeviceOptions: any[] = [];

  constructor(
    public layoutService: LayoutService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private serverService: ServersService
  ) {}

  skillData = {};

  skillTemplate = {};

  configureSkillSubmit() {
    this.showConfigureSkillDialog = false;

    this.messageService.add({
      severity: "info",
      summary: "Skill Configuration",
      detail: "Skill configuration sent to server",
    });
  }

  configureSkill(event: any, skill: any) {
    if (!skill.configuration_template) {
      return;
    }

    this.skillTemplate = skill.configuration_template;
    this.skillData = skill.configuration;
    this.showConfigureSkillDialog = true;
  }

  stopSkill(event: any, skill: any) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event.target || new EventTarget(),
      message: "Are you sure that you want to stop this skill?",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.messageService.add({
          severity: "info",
          summary: "Stopping Skill",
          detail: "Sending message to server to stop skill",
        });

        const payload = {
          routing_key: skill.routing_key,
          device: skill.device,
          use_precision: skill.use_precision,
          server_id: skill.server_id,
        };

        this.serverService.stopSkill(payload);
        this.serverService.getServers();

        for (let i = 0; i < this.skills.length; i++) {
          const checkSkill = this.skills[i];
          if (
            checkSkill.routing_key == skill.routing_key &&
            checkSkill.server_id == skill.server_id &&
            checkSkill.device == skill.device &&
            checkSkill.use_precision == skill.use_precision
          ) {
            delete this.skills[i];
            this.skills.splice(i, 1);
            break;
          }
        }
      },
      reject: () => {},
    });
  }

  ngOnInit() {
    this.runSkillDeviceOptions = [];

    this.serverUpdates = this.serverService.servers.subscribe(
      (data: Server) => {
        const skillIndex = this.buildSkillIndex(data.installed_skills);
        const deviceIndex = this.buildDeviceIndex(data.gpu);

        this.parseRunningSkills(
          data.running_skills,
          skillIndex,
          deviceIndex,
          data
        );

        // update or create the record
        let serverFound = false;
        for (let i = 0; i < this.servers.length; i++) {
          const server = this.servers[i];
          if (server.server_id == data.server_id) {
            this.servers[i] = data;
            serverFound = true;
            break;
          }
        }

        if (!serverFound) this.servers.push(data);
      }
    );

    this.serverService.getServers();
  }

  private buildSkillIndex(installedSkills: any[]) {
    const skillIndex: any = {};

    for (let i = 0; i < installedSkills.length; i++) {
      const skill = installedSkills[i];
      skillIndex[skill.routing_key] = skill;
    }

    return skillIndex;
  }

  private buildDeviceIndex(gpuData: any[]) {
    const deviceIndex: any = {};

    for (let i = 0; i < gpuData.length; i++) {
      const gpu = gpuData[i];
      deviceIndex[gpu.device] = gpu;
    }

    deviceIndex["cpu"] = { name: "CPU " };
    return deviceIndex;
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

  refreshServers() {
    this.serverService.getServers();
  }

  private parseRunningSkills(
    runningSkills: any[],
    skillIndex: any,
    deviceIndex: any,
    data: any
  ) {
    for (let i = 0; i < runningSkills.length; i++) {
      const skill = runningSkills[i];
      const skillData = skillIndex[skill.routing_key];
      skill.label = skillData.label;
      skill.device.indexOf("split") === 0
        ? "Multi GPU"
        : deviceIndex[skill.device].name;
      skill.server_id = data.server_id;
      skill.shortcut =
        skillData.shortcut && skillData.shortcut.length
          ? skillData.shortcut + " "
          : "";
      skill.server_label = data.server_label;
      skill.configuration = skillData.configuration;
      skill.configuration_template = skillData.configuration_template;
      skill.configurable = skillData.configuration_template.vault_path
        ? true
        : false;

      const ramSummary = this.convertBytes(skill.ram, 1000);
      skill.ram_summary = `${ramSummary.value} ${ramSummary.unit}`;

      let skillFound = false;
      for (let j = 0; j < this.skills.length; j++) {
        const checkSkill = this.skills[j];
        if (
          checkSkill.server_id != skill.server_id ||
          checkSkill.device != skill.device ||
          checkSkill.routing_key != skill.routing_key
        ) {
          continue;
        }
        this.skills[j] = skill;
        skillFound = true;
        break;
      }

      if (!skillFound) this.skills.push(skill);
    }
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

  ngOnDestroy() {
    this.serverUpdates.unsubscribe();
  }
}
