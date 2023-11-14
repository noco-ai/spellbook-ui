import { AppLayoutComponent } from "./layout/component/app.layout.component";

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
      {
        path: "app-manager",
        loadChildren: () =>
          import("src/app/modules/core/app-manager/app-manager.module").then(
            (m) => m["AppManagerModule"]
          ),
        data: { breadcrumb: "App Manager" },
      },
      {
        path: "settings/:namespace/:module",
        loadChildren: () =>
          import("src/app/modules/core/app-settings/app-settings.module").then(
            (m) => m["AppSettingsModule"]
          ),
        data: { breadcrumb: "Settings" },
      },
      {
        path: "ai-assistant",
        loadChildren: () =>
          import("src/app/modules/core/assistant/assistant.module").then(
            (m) => m["AssistantModule"]
          ),
        data: { breadcrumb: "AI Assistant" },
      },
      {
        path: "servers",
        loadChildren: () =>
          import("src/app/modules/core/servers/servers.module").then(
            (m) => m["GolemModule"]
          ),
        data: { breadcrumb: "Servers" },
      },
    ],
  },
];
export const menu = [];
