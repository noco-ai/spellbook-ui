import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Input,
  Output,
} from "@angular/core";
import { AppManagerService } from "../../service/app-manager.service";
import { Subscription } from "rxjs";
import { DomSanitizer } from "@angular/platform-browser";
import { ConfirmationService } from "primeng/api";
import { LayoutService } from "src/app/layout/service/app.layout.service";

@Component({
  selector: "app-manager-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.scss"],
  providers: [ConfirmationService],
})
export class AppManagerList implements OnInit, OnDestroy {
  serverUpdates!: Subscription;
  appUpdates!: Subscription;
  apps: any[] = [];
  baseIconUrl!: string;
  useSpellLabels: boolean = false;
  @Input() displayType: string = "application";
  @Output() appUpdated = new EventEmitter<any>();

  constructor(
    private appService: AppManagerService,
    private sanitizer: DomSanitizer,
    private confirmationService: ConfirmationService,
    private layoutService: LayoutService
  ) {}

  ngOnDestroy() {
    this.appUpdates.unsubscribe();
  }

  ngOnInit() {
    this.appUpdates = this.appService.apps.subscribe((data: any[]) => {
      data.sort((a, b) => {
        if (a.label < b.label) {
          return -1;
        }
        if (a.label > b.label) {
          return 1;
        }
        return 0;
      });
      this.apps = data;
      this.useSpellLabels = this.layoutService.config.spellLabels;
    });

    this.appService.getApps();
    this.baseIconUrl = this.appService.getSocketUrl();
  }

  allowHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  installApp(app: any) {
    const icon = app.is_installed ? "pi-exclamation-triangle" : "pi-download";
    const type = app.type == "application" ? "application" : "chat ability";
    const message = app.is_installed
      ? `Are you sure that you want uninstall this ${type}?`
      : `Are you sure that you want install this ${type}?`;

    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: message,
      icon: `pi ${icon}`,
      accept: () => {
        this.appService.updateApp(app);
      },
      reject: () => {},
    });

    //this.appUpdated.emit(app);
  }
}
