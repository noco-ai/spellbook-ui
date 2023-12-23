import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { MessageService } from "primeng/api";
import { LayoutService } from "src/app/layout/service/app.layout.service";
import { SocketService } from "src/app/service/sockets.service";

@Component({
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  rememberMe: boolean = false;
  username: string = "";
  password: string = "";

  constructor(
    private layoutService: LayoutService,
    private http: HttpClient,
    private socketService: SocketService,
    private messageService: MessageService
  ) {}

  get dark(): boolean {
    return this.layoutService.config.colorScheme !== "light";
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") this.login();
  }

  login() {
    this.http
      .post(
        this.socketService.getBaseUrl() + "api/v1/token",
        {
          username: this.username,
          password: this.password,
        },
        { withCredentials: true }
      )
      .subscribe(
        (data: any) => {
          localStorage.setItem("auth_token", data.token);
          window.location.href = "#";
          window.location.reload();
        },
        (error) => {
          const errorMessage =
            error.status == 401
              ? "Invalid username or password"
              : "A unknown error occurred";

          this.messageService.add({
            severity: "error",
            summary: "Could not login",
            detail: errorMessage,
          });
          this.password = "";
          this.username = "";
        }
      );
  }
}
