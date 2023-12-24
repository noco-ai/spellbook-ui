import {
  Component,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { Subscription } from "rxjs";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { ConfirmationService, MessageService } from "primeng/api";
import { Server } from "../api/server";
import { ServersService } from "../service/servers.service";
import { SocketService } from "src/app/service/sockets.service";

interface expandedRows {
  [key: string]: boolean;
}

@Component({
  templateUrl: "./servers.component.html",
  styleUrls: ["./servers.component.scss"],
  providers: [ConfirmationService, MessageService],
})
export class GolemComponent implements OnInit, OnDestroy {
  serverUpdates!: Subscription;
  toastUpdates!: Subscription;
  servers: Server[] = [];
  skills: any[] = [];
  uses: any[] = [];
  isExpanded: boolean = false;
  expandedRows: expandedRows = {};
  showConfigureSkillDialog: boolean = false;
  availableSkills: any[] = [];
  skillData = {};
  skillTemplate = {};
  showCustomSkillDialog: boolean = false;
  customSkillDefinition: string = "";
  customSkillHandler!: any;
  handlerOptions: any = [];
  skillExampleOptions: any = [];

  constructor(
    public layoutService: LayoutService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private serverService: ServersService,
    private socketService: SocketService
  ) {}

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

  expandAll() {
    if (!this.isExpanded) {
      this.servers.forEach((server) =>
        server && server.server_id
          ? (this.expandedRows[server.server_id] = true)
          : ""
      );
    } else {
      this.expandedRows = {};
    }
    this.isExpanded = !this.isExpanded;
  }

  ngOnInit() {
    this.toastUpdates = this.socketService.onToastMessage.subscribe(
      (toastData: any) => {
        if (toastData.summary == "Custom skill installed 🚀") {
          this.showCustomSkillDialog = false;
        }
        this.messageService.add(toastData);
      }
    );

    this.serverUpdates = this.serverService.servers.subscribe(
      (data: Server) => {
        const { hdUsed, hdTotal, ramUsed, ramTotal } = this.getConvertedMemory(
          data.hd.used,
          data.hd.total,
          data.ram.used,
          data.ram.total
        );
        const { gpuUsed, gpuTotal, gpuSummary } = this.processGPUData(data.gpu);

        data.hd_summary = hdUsed + " / " + hdTotal;
        data.ram_summary = ramUsed + " / " + ramTotal;
        data.gpu_summary = gpuTotal.value ? gpuSummary : "--";
        data.gpu_ram_used = gpuUsed.raw
          ? parseFloat(((gpuUsed.raw / gpuTotal.raw) * 100).toPrecision(2))
          : 0;
        data.gpu_ram_total = gpuTotal.value;

        //data.index = this.servers.length;

        const skillIndex = this.buildSkillIndex(data.installed_skills);
        const deviceIndex = this.buildDeviceIndex(data.gpu);

        this.parseRunningSkills(
          data.running_skills,
          skillIndex,
          deviceIndex,
          data
        );
        this.parseInstalledSkills(data.installed_skills, skillIndex, data);

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

  private getConvertedMemory(
    hdUsed: number,
    hdTotal: number,
    ramUsed: number,
    ramTotal: number
  ) {
    const convertedHdUsed = this.serverService.convertBytes(hdUsed);
    const convertedHdTotal = this.serverService.convertBytes(hdTotal);
    const convertedRamUsed = this.serverService.convertBytes(ramUsed);
    const convertedRamTotal = this.serverService.convertBytes(ramTotal);

    return {
      hdUsed: Math.floor(convertedHdUsed.value) + " " + convertedHdUsed.unit,
      hdTotal: Math.floor(convertedHdTotal.value) + " " + convertedHdTotal.unit,
      ramUsed: Math.floor(convertedRamUsed.value) + " " + convertedRamUsed.unit,
      ramTotal:
        Math.floor(convertedRamTotal.value) + " " + convertedRamTotal.unit,
    };
  }

  private processGPUData(gpuData: any[]) {
    let gpuUsedNum = 0;
    let gpuTotalNum = 0;

    for (let i = 0; i < gpuData.length; i++) {
      const gpu = gpuData[i];
      gpuTotalNum += gpu.memory_total;
      gpuUsedNum += gpu.memory_used;

      const convertedTotal = this.serverService.convertBytes(gpu.memory_total);
      gpu.memory_total_summary = `${convertedTotal.value} ${convertedTotal.unit}`;

      const convertedUsed = this.serverService.convertBytes(gpu.memory_used);
      gpu.memory_used_summary = `${convertedUsed.value} ${convertedUsed.unit}`;

      const convertedFree = this.serverService.convertBytes(gpu.memory_free);
      gpu.memory_free_summary = `${convertedFree.value} ${convertedFree.unit}`;
    }

    const gpuTotal = this.serverService.convertBytes(gpuTotalNum);
    const gpuUsed = this.serverService.convertBytes(gpuUsedNum);

    const gpuSummary = `${Math.floor(gpuUsed.value)} ${
      gpuUsed.unit
    } / ${Math.floor(gpuTotal.value)} ${gpuTotal.unit}`;

    return { gpuUsed, gpuTotal, gpuSummary };
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
    return this.serverService.determineSeverity(status);
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
      skill.label = skillIndex[skill.routing_key].label;
      skill.device_label =
        skill.device.indexOf("split") === 0
          ? "Multi GPU"
          : deviceIndex[skill.device].name;
      skill.server_id = data.server_id;
      skill.server_label = data.server_label;
      skill.configuration = skillIndex[skill.routing_key].configuration;
      skill.configuration_template =
        skillIndex[skill.routing_key].configuration_template;
      skill.configurable = skillIndex[skill.routing_key].configuration_template
        .vault_path
        ? true
        : false;

      const ramSummary = this.serverService.convertBytes(skill.ram, 1000);
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

  private parseInstalledSkills(
    installedSkills: any[],
    skillIndex: any,
    serverData: Server
  ) {
    const availableSkills = [];
    const availableUses = [];
    const availableInstalledUses = [];
    const availableUsesIndex: any = {};
    const availableInstalledUsesIndex: any = {};
    const pruneList: any = {};

    for (let i = 0; i < installedSkills.length; i++) {
      const skill = installedSkills[i];

      for (let memUsage in skill.memory_usage) {
        const devices = [];
        const ramUse: number = skill.memory_usage[memUsage];
        let anyDeviceAvailable = false;

        for (let device in skill.available_precision) {
          if (skill.available_precision[device].includes(memUsage)) {
            devices.push(device.toUpperCase());
          }
        }

        // build the options array for devices
        const deviceOptions = [];
        if (devices.includes("CPU")) {
          const systemFreeMemory = Math.ceil(
            serverData.ram.available / (1024 * 1024)
          );
          const disabled = systemFreeMemory < ramUse ? true : false;
          deviceOptions.push({
            value: "cpu",
            label: "CPU",
            disabled: disabled,
          });
          anyDeviceAvailable = true;
        }
        if (devices.includes("CUDA")) {
          let totalFreeMemory = 0;
          let largeModel = true;
          for (let j = 0; j < serverData.gpu.length; j++) {
            const gpu = serverData.gpu[j];
            const gpuFreeMemory = Math.ceil(gpu.memory_free / (1024 * 1024));
            totalFreeMemory += gpuFreeMemory;

            const disabled = gpuFreeMemory < ramUse ? true : false;
            deviceOptions.push({
              value: gpu.device,
              label: gpu.name,
              disabled: disabled,
            });
            if (!disabled) {
              largeModel = false;
              anyDeviceAvailable = true;
            }
          }

          // if we have more than one GPU, the skill supports splitting and model will not fit on any single GPU
          if (
            serverData.gpu.length > 1 &&
            skill.multi_gpu_support &&
            largeModel
          ) {
            const disabled = totalFreeMemory < ramUse ? true : false;
            deviceOptions.push({
              value: "split",
              label: "Multi GPU",
              disabled: disabled,
            });
            if (!disabled) anyDeviceAvailable = true;
          }
        }

        // check to make sure the skills models are installed
        const skillInstalledData = this.serverService.isSkillInstalled(
          skill,
          memUsage,
          serverData
        );
        const installed = skillInstalledData.installed;
        const downloading = skillInstalledData.downloading;

        const ramData = this.serverService.convertBytes(ramUse * 1000000, 1000);
        const installedSkill = {
          label: skill.label,
          ram: ramUse * 1000000,
          device: devices,
          routing_key: skill.routing_key,
          device_options: deviceOptions,
          precision: memUsage.toUpperCase(),
          precision_original: memUsage,
          server_id: serverData.server_id,
          ram_label: `${ramData.value} ${ramData.unit}`,
          installed: installed,
          downloading: downloading,
          can_run: anyDeviceAvailable,
          gpu: serverData.gpu,
          handler_key: skill.handler_key,
          raw: skill.raw,
          multi_gpu_support: skill.multi_gpu_support,
        };

        for (let j = 0; j < skill.use.length; j++) {
          let skillUse: string = skill.use[j]
            .replace(/_/g, " ")
            .split(" ")
            .map((word: string) => {
              const [firstChar, ...restOfWord] = word;
              return firstChar.toUpperCase() + restOfWord.join("");
            })
            .join(" ");

          skillUse =
            skillUse.indexOf("Embedding") === -1 ? skillUse : "Embedding";
          // all embedding models in one list
          if (!availableUsesIndex[skillUse]) {
            availableUsesIndex[skillUse] = [];
            availableInstalledUsesIndex[skillUse] = [];
          }

          const skillKey =
            `${skillUse}${skill.routing_key}${installedSkill.precision}`
              .replace(/[\s/-]/g, "_")
              .toLowerCase();
          if (!pruneList[skillKey] && installedSkill.can_run) {
            if (installedSkill.installed || installedSkill.downloading) {
              availableInstalledUsesIndex[skillUse].push(installedSkill);
            } else {
              availableUsesIndex[skillUse].push(installedSkill);
            }
            pruneList[skillKey] = true;
          }
        }

        availableSkills.push(installedSkill);
      }
    }

    // list of not installed skills
    for (const use in availableUsesIndex) {
      const useArray = availableUsesIndex[use];
      availableUses.push({
        use: use,
        num_skills: availableUsesIndex[use].length,
        skills: useArray,
      });
    }

    // list of installed skills
    for (const use in availableInstalledUsesIndex) {
      const useArray = availableInstalledUsesIndex[use];
      availableInstalledUses.push({
        use: use,
        num_skills: availableInstalledUsesIndex[use].length,
        skills: useArray,
      });
    }
    serverData.skill_groups = availableUses;
    serverData.skill_groups_installed = availableInstalledUses;
    this.availableSkills = availableSkills;
  }

  ngOnDestroy() {
    this.serverUpdates.unsubscribe();
    this.toastUpdates.unsubscribe();
  }

  createCustomSkill(server: Server) {
    this.handlerOptions = server.handlers;
    this.showCustomSkillDialog = true;
  }

  updateExampleList(handlerData: any) {
    const newOptions = [];
    const handlerKey = handlerData.value.unique_key;
    for (let i = 0; i < this.availableSkills.length; i++) {
      const current = this.availableSkills[i];
      if (current.handler_key != handlerKey) continue;
      newOptions.push(current);
    }
    this.skillExampleOptions = newOptions;
  }

  updateExampleText(handlerOption: any) {
    this.customSkillDefinition = handlerOption.value.raw;
  }

  submitCustomSkill() {
    this.serverService.createCustomSkill(this.customSkillDefinition);
  }
}
