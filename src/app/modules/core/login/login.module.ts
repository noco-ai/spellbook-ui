import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoginRoutingModule } from "./login-routing.module";
import { LoginComponent } from "./component/login/login.component";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { AppConfigModule } from "src/app/layout/config/app.config.module";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";

@NgModule({
  imports: [
    CommonModule,
    LoginRoutingModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    FormsModule,
    AppConfigModule,
    ToastModule,
  ],
  declarations: [LoginComponent],
  providers: [MessageService],
})
export class LoginModule {}
