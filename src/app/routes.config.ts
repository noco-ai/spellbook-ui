import { AppLayoutComponent } from "./layout/component/app.layout.component";
import { UserAccessGuard } from "./user-access.guard";

export const routes = [
  {
    path: "",
    component: AppLayoutComponent,
    children: [
      {
        path: "",
        redirectTo: "ai-assistant",
        pathMatch: "full" as "full",
      },
      //{ path: "**", canActivate: [UserAccessGuard] },
      {
        path: "app-manager",
        loadChildren: () =>
          import("src/app/modules/core/app-manager/app-manager.module").then(
            (m) => m["AppManagerModule"]
          ),
        data: { breadcrumb: "App Manager" },
        canActivate: [UserAccessGuard],
      },
      {
        path: "settings/:namespace/:module",
        loadChildren: () =>
          import("src/app/modules/core/app-settings/app-settings.module").then(
            (m) => m["AppSettingsModule"]
          ),
        data: { breadcrumb: "Settings" },
        canActivate: [UserAccessGuard],
      },
      {
        path: "ai-assistant",
        loadChildren: () =>
          import("src/app/modules/core/assistant/assistant.module").then(
            (m) => m["AssistantModule"]
          ),
        data: { breadcrumb: "AI Assistant" },
        canActivate: [UserAccessGuard],
      },
      {
        path: "servers",
        loadChildren: () =>
          import("src/app/modules/core/servers/servers.module").then(
            (m) => m["GolemModule"]
          ),
        data: { breadcrumb: "Servers" },
        canActivate: [UserAccessGuard],
      },
      {
        path: "llm-explorer",
        loadChildren: () =>
          import("src/app/modules/apps/llm-explorer/llm-explorer.module").then(
            (m) => m["LlmExplorerModule"]
          ),
        data: { breadcrumb: "LLM Explorer" },
        canActivate: [UserAccessGuard],
      },
      {
        path: "image-generator",
        loadChildren: () =>
          import(
            "src/app/modules/apps/image-generator/image-generator.module"
          ).then((m) => m["ImageGeneratorModule"]),
        data: { breadcrumb: "Image Generator" },
        canActivate: [UserAccessGuard],
      },
      {
        path: "login",
        loadChildren: () =>
          import("src/app/modules/core/login/login.module").then(
            (m) => m["LoginModule"]
          ),
        data: { breadcrumb: "Login" },
      },
      {
        path: "unauthorized",
        loadChildren: () =>
          import("src/app/modules/core/unauthorized/unauthorized.module").then(
            (m) => m["UnauthorizedModule"]
          ),
        data: { breadcrumb: "" },
      },
      {
        path: "users",
        loadChildren: () =>
          import("src/app/modules/core/user-manager/user-manager.module").then(
            (m) => m["UserManagerModule"]
          ),
        data: { breadcrumb: "User Manager" },
        canActivate: [UserAccessGuard],
      },
    ],
  },
];
export const menu = [];
