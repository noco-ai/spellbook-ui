import { OnInit } from "@angular/core";
import { Component } from "@angular/core";
import { SocketService } from "src/app/service/sockets.service";
import { LayoutService } from "../../service/app.layout.service";

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
})
export class AppMenuComponent implements OnInit {
  model: any[] = [];

  constructor(
    private socketService: SocketService,
    private layoutService: LayoutService
  ) {}

  ngOnInit() {
    this.socketService.subscribeToEvent("menu", (menu: any) => {
      this.model = menu;
    });
    this.socketService.send("command", {
      command: "get_menu",
      spell_labels: this.layoutService.config.spellLabels,
    });
  }
}
