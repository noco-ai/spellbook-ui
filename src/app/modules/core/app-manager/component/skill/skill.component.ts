import { Component, OnDestroy, OnInit, AfterViewChecked } from "@angular/core";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { Router } from "@angular/router";
//import { ConfirmationService, MessageService } from "primeng/api";

@Component({
  templateUrl: "./skill.component.html",
  //styleUrls: ["./main-page.component.scss"],
  //providers: [ConfirmationService, MessageService],
}) //, //AfterViewChecked
export class AppManagerSkills implements OnInit, OnDestroy {
  constructor(
    private layoutService: LayoutService,
    private router: Router //private serversService: ServersService, //private sanitizer: DomSanitizer, //private confirmationService: ConfirmationService, //private messageService: MessageService
  ) {}

  ngOnDestroy() {
    //this.filesSubscription.unsubscribe();
    //this.skillsSubscription.unsubscribe();
    //this.configSubscription.unsubscribe();
  }

  ngOnInit() {}
}
