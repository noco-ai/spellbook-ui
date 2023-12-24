import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UserManagerService } from "../../service/user-manager.service";
import { UserGroup } from "../../api/user-group";
import { Server } from "../../../servers/api/server";
import { Subscription } from "rxjs";
import { ConfirmationService } from "primeng/api";

@Component({
  templateUrl: "./groups.component.html",
  styleUrls: ["./groups.component.scss"],
})
export class UserManagerGroups implements OnInit, OnDestroy {
  userGroups: UserGroup[] = [];
  servers: Server[] = [];
  groupsSubscription!: Subscription;
  serverSubscription!: Subscription;
  appsSubscription!: Subscription;
  installedSkills: any[] = [];
  installedApps: any[] = [];
  installedChatAbilities: any[] = [];
  editingGroup: boolean = false;
  currentGroup: UserGroup;
  emptyGroup: UserGroup = {
    name: "",
    description: "",
    chat_abilities: [],
    applications: [],
    skills: [],
    unique_key: null,
  };

  constructor(
    private router: Router,
    private userService: UserManagerService,
    private confirmationService: ConfirmationService
  ) {
    this.currentGroup = JSON.parse(JSON.stringify(this.emptyGroup));
  }

  ngOnDestroy() {
    this.serverSubscription.unsubscribe();
    this.groupsSubscription.unsubscribe();
    this.appsSubscription.unsubscribe();
  }

  ngOnInit() {
    this.groupsSubscription = this.userService.groups.subscribe(
      (groups: UserGroup[]) => {
        this.userGroups = groups;
        this.editingGroup = false;
      }
    );
    this.userService.getUserGroups();

    this.serverSubscription = this.userService.servers.subscribe(
      (server: Server) => this.buildServerLists(server)
    );

    this.appsSubscription = this.userService.apps.subscribe((apps) => {
      this.installedChatAbilities = [];
      this.installedApps = [];
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        if (!app.visible || !app.is_installed) continue;
        const newCheckbox = {
          value: app.unique_key,
          label: app.label,
        };
        if (app.type === "chat_ability") {
          this.installedChatAbilities.push(newCheckbox);
        } else if (app.type === "application") {
          this.installedApps.push(newCheckbox);
        }
      }
    });
    this.userService.getServers();
    this.userService.getApps();
  }

  selectAll($event: Event, group: UserGroup, type: string) {
    $event.preventDefault();
    const all = [];
    let getAll = [];
    if (type === "applications") {
      getAll = this.installedApps;
    } else if (type === "chat_abilities") {
      getAll = this.installedChatAbilities;
    } else if (type === "skills") {
      getAll = this.installedSkills;
    }

    for (let i = 0; i < getAll.length; i++) {
      all.push(getAll[i].value);
    }

    if (type === "applications") {
      group.applications = all;
    } else if (type === "chat_abilities") {
      group.chat_abilities = all;
    } else if (type === "skills") {
      group.skills = all;
    }
  }

  unselectAll($event: Event, group: UserGroup, type: string) {
    $event.preventDefault();
    if (type === "applications") {
      group.applications = [];
    } else if (type === "chat_abilities") {
      group.chat_abilities = [];
    } else if (type === "skills") {
      group.skills = [];
    }
  }

  addGroup() {
    this.currentGroup = JSON.parse(JSON.stringify(this.emptyGroup));
    this.editingGroup = true;
  }

  cancelEditGroup() {
    this.editingGroup = false;
  }

  editGroup(group: UserGroup) {
    this.currentGroup = JSON.parse(JSON.stringify(group));
    this.editingGroup = true;
  }

  saveGroup(group: UserGroup) {
    this.userService.saveUserGroup(group);
  }

  deleteGroup(uniqueKey: string) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete this user group?`,
      icon: `pi pi-icon-trash`,
      accept: () => {
        this.userService.deleteUserGroup(uniqueKey);
      },
      reject: () => {},
    });
  }

  getUniqueValueLabelList(objects: any[]): any[] {
    const uniquePairs: { [key: string]: boolean } = {};
    const result: any[] = [];
    objects.forEach((obj) => {
      if (!uniquePairs[obj.routing_key]) {
        result.push({ value: obj.routing_key, label: obj.label });
        uniquePairs[obj.routing_key] = true;
      }
    });
    return result;
  }

  private mergeUniqueLists(list1: any[], list2: any[]): any[] {
    const combinedList = [...list1, ...list2];
    const uniqueSet = new Map<string, any>();
    combinedList.forEach((item) => {
      uniqueSet.set(item.value, item);
    });
    return Array.from(uniqueSet.values());
  }

  private buildServerLists(server: Server) {
    const uniqueList = this.getUniqueValueLabelList(server.installed_skills);
    this.installedSkills = this.mergeUniqueLists(
      this.installedSkills,
      uniqueList
    );
  }
}
