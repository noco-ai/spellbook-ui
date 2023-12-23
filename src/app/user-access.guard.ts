import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from "@angular/router";
import { Observable } from "rxjs";
import { SocketService } from "./service/sockets.service";

type MenuItem = {
  label: string;
  icon?: string;
  items?: MenuItem[];
  routerLink?: string;
  sort_order?: number;
  admin_only?: boolean;
  settings_link?: string;
  item_module?: string;
  style?: string;
};

@Injectable({
  providedIn: "root",
})
export class UserAccessGuard implements CanActivate {
  menuData!: any;
  routerLinks!: string[];

  constructor(private socketService: SocketService, private router: Router) {
    this.socketService.subscribeToEvent("menu", (menuData) => {
      this.menuData = menuData;
    });
    this.socketService.send("command", {
      command: "get_menu",
      spell_labels: false,
    });
  }

  private extractRouterLinks(menuItems: MenuItem[]): string[] {
    let links: string[] = [];

    for (let item of menuItems) {
      if (item.routerLink) {
        links.push(item.routerLink);
      }

      if (item.items && item.items.length > 0) {
        links = links.concat(this.extractRouterLinks(item.items));
      }
    }
    links.push("settings/spellbook/core");
    return links;
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!this.menuData) {
      return new Promise((resolve, reject) => {
        function waitForData(context: any) {
          if (context.menuData) {
            context.routerLinks = context.extractRouterLinks(context.menuData);
            resolve(
              context.routerLinks.includes(next?.routeConfig?.path || "")
            );
            return;
          }
          window.setTimeout(() => {
            waitForData(context);
          }, 100);
        }
        waitForData(this);
      });
    }

    //const approvedRoutes = this.socketService.getApprovedRoutes();
    const configPath = next.routeConfig?.path || "";
    const params = this.extractParams(configPath, next);
    const currentRoute = this.buildRouteString(configPath, params);

    if (this.routerLinks.includes(currentRoute || "")) {
      return true;
    } else {
      this.router.navigate(["unauthorized"]);
      return false;
    }
  }

  private extractParams(
    configPath: string,
    route: ActivatedRouteSnapshot
  ): Map<string, string> {
    const params = new Map<string, string>();
    const paramPattern = /:(\w+)/g;
    let match;

    while ((match = paramPattern.exec(configPath)) !== null) {
      const paramName = match[1];
      const paramValue = route.paramMap.get(paramName);
      if (paramValue) {
        params.set(paramName, paramValue);
      }
    }

    return params;
  }

  private buildRouteString(
    configPath: string,
    params: Map<string, string>
  ): string {
    let route = configPath;
    params.forEach((value, key) => {
      route = route.replace(`:${key}`, value);
    });
    return route;
  }
}
