import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { Subscription } from "rxjs";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { ConfirmationService, MessageService } from "primeng/api";
import { Server } from "../../api/server";
import { ServersService } from "../../service/servers.service";

interface expandedRows {
  [key: string]: boolean;
}

@Component({
  selector: "skill-list",
  templateUrl: "./skill-list.component.html",
  styleUrls: ["../servers.component.scss"],
  providers: [ConfirmationService, MessageService],
})
export class SkillList implements OnInit, OnDestroy, OnChanges {
  availableSkills: any[] = [];
  showRunSkillDialog: boolean = false;
  currentRunSkill: any = null;
  runSkillDeviceOptions: any[] = [];
  runSkillSelectedDeviceOptions: string = "";
  specialLabels = ["Llama 2 7B (ExLlama)", "E5 Large v2"];
  @Input() server: any;
  @Input() listType: string = "available";

  constructor(
    public layoutService: LayoutService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private serverService: ServersService
  ) {}

  expandedUse: expandedRows = {};

  expandRow() {
    localStorage.setItem(
      `${this.server.server_id}-expand-${this.listType}`,
      JSON.stringify(this.expandedUse)
    );
  }

  ngOnInit() {
    this.runSkillDeviceOptions = [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["server"]) {
      const serverId = changes["server"].currentValue.server_id;
      const storedExpanded = localStorage.getItem(
        `${serverId}-expand-${this.listType}`
      );
      if (storedExpanded) this.expandedUse = JSON.parse(storedExpanded);
    }
  }

  ngOnDestroy() {}

  installSkill(event: Event, skill: any) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event.target || new EventTarget(),
      message: "Are you sure that you want to download this skill?",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        const payload = {
          routing_key: skill.routing_key,
          server_id: skill.server_id,
          precision: skill.precision_original,
        };
        this.serverService.installSkill(payload);
        skill.downloading = true;

        this.messageService.add({
          severity: "info",
          summary: "Installing skill",
          detail: "Sending message to server to install skill",
        });
      },
      reject: () => {},
    });
  }

  runSkill(skill: any) {
    this.currentRunSkill = skill;
    this.runSkillSelectedDeviceOptions = "";
    this.runSkillDeviceOptions = skill.device_options;
    if (skill.multi_gpu_support) {
      const split = this.multiGpuSplit(skill);
      for (let i = 0; i < skill.gpu.length; i++) {
        skill.gpu[i].memory_split = split[i];
      }
    }
    this.showRunSkillDialog = true;
  }

  multiGpuSplit(json: any): number[] {
    let totalFreeMemory = 0;
    let memoryAllocations: number[] = [];
    const totalSize = json.ram / 1000;

    // Calculate the total free memory across all GPUs
    for (let gpu of json.gpu) {
      totalFreeMemory += gpu.memory_free;
    }

    for (let gpu of json.gpu) {
      const proportion = gpu.memory_free / totalFreeMemory;
      memoryAllocations.push(Math.ceil(totalSize * proportion) / 1000000);
    }

    return memoryAllocations;
  }

  runSkillSubmit() {
    let useDevice = this.runSkillSelectedDeviceOptions;
    if (this.runSkillSelectedDeviceOptions == "split") {
      useDevice += ":";
      useDevice += this.currentRunSkill.gpu
        .map((gpu: any) => gpu.memory_split)
        .join(",");
    }
    const payload = {
      routing_key: this.currentRunSkill.routing_key,
      device: useDevice,
      use_precision: this.currentRunSkill.precision.toLowerCase(),
      server_id: this.currentRunSkill.server_id,
    };

    this.serverService.runSkill(payload);
    this.showRunSkillDialog = false;

    this.messageService.add({
      severity: "info",
      summary: "Starting skill",
      detail: "Sending message to server to start skill",
    });

    this.serverService.getServers();
  }
}
