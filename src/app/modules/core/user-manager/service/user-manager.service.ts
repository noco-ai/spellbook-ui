import { Injectable, EventEmitter } from "@angular/core";
import { SocketService } from "src/app/service/sockets.service";
import { Server } from "../../servers/api/server";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { UserGroup } from "../api/user-group";
import { User } from "../api/user";

@Injectable({
  providedIn: "root",
})
export class UserManagerService {
  servers: EventEmitter<Server> = new EventEmitter<Server>();
  apps: EventEmitter<any> = new EventEmitter<any>();
  groups: EventEmitter<UserGroup[]> = new EventEmitter<UserGroup[]>();
  users: EventEmitter<User[]> = new EventEmitter<User[]>();

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
      "save_user_group",
      (data) => {
        this.getUserGroups();
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "delete_user_group",
      (data) => {
        this.getUserGroups();
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_user_groups",
      (data) => {
        this.groups.emit(data.groups);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_users",
      (data) => {
        this.users.emit(data.users);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "save_user",
      (data) => {
        this.getUsers();
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "delete_user",
      (data) => {
        this.getUsers();
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

  getUsers() {
    this.socketService.send("command", {
      command: "get_users",
    });
  }

  deleteUser(username: string) {
    this.socketService.send("command", {
      command: "delete_user",
      username: username,
    });
  }

  saveUser(user: User) {
    this.socketService.send("command", {
      command: "save_user",
      user: user,
    });
  }

  getUserGroups() {
    this.socketService.send("command", {
      command: "get_user_groups",
    });
  }

  deleteUserGroup(uniqueKey: string) {
    this.socketService.send("command", {
      command: "delete_user_group",
      unique_key: uniqueKey,
    });
  }

  saveUserGroup(group: UserGroup) {
    this.socketService.send("command", {
      command: "save_user_group",
      group: group,
    });
  }

  updateUser(app: any) {
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
