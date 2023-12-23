import { Component, OnDestroy, OnInit } from "@angular/core";
import { UserManagerService } from "../../service/user-manager.service";
import { Subscription } from "rxjs";
import { ConfirmationService } from "primeng/api";
import { UserGroup } from "../../api/user-group";
import { User } from "../../api/user";

@Component({
  selector: "user-manager-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.scss"],
  providers: [ConfirmationService],
})
export class UserManagerList implements OnInit, OnDestroy {
  groupsSubscription!: Subscription;
  usersSubscription!: Subscription;
  editingUser: boolean = false;
  userGroups: UserGroup[] = [];
  currentUser!: User;
  emptyUser: User = {
    id: 0,
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",
    groups: [],
    is_admin: false,
    is_enabled: true,
  };
  users!: User[];

  constructor(
    private userService: UserManagerService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnDestroy() {
    this.groupsSubscription.unsubscribe();
  }

  ngOnInit() {
    this.groupsSubscription = this.userService.groups.subscribe(
      (groups: UserGroup[]) => {
        this.userGroups = groups;
      }
    );
    this.userService.getUserGroups();

    this.usersSubscription = this.userService.users.subscribe(
      (users: User[]) => {
        this.users = users;
      }
    );
    this.userService.getUsers();
  }

  deleteUser(username: string) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete user account ${username}?`,
      icon: `pi pi-icon-trash`,
      accept: () => {
        this.userService.deleteUser(username);
      },
      reject: () => {},
    });
  }

  editUser(user: User) {
    this.currentUser = user;
    this.editingUser = true;
  }

  addUser() {
    this.currentUser = JSON.parse(JSON.stringify(this.emptyUser));
    this.editingUser = true;
  }

  saveUser() {
    this.editingUser = false;
    this.userService.saveUser(this.currentUser);
  }

  cancelEditUser() {
    this.editingUser = false;
  }
}
