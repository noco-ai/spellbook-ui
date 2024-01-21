import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { io, Socket } from "socket.io-client";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";

interface FilterDetail {
  filter: any;
  emitter: EventEmitter<any>;
}

@Injectable({
  providedIn: "root",
})
export class SocketService {
  private socket: Socket;
  private token?: string;
  public onConnect: EventEmitter<any> = new EventEmitter<any>();
  public onDisconnect: EventEmitter<any> = new EventEmitter<any>();
  public onToastMessage: EventEmitter<any> = new EventEmitter<any>();

  constructor(private http: HttpClient, private router: Router) {
    this.socket = io(this.getBaseUrl(), {
      extraHeaders: {
        authorization: `${this.getToken()}`,
      },
    });
    this.socket.on("connect", () => {
      this.onConnect.emit();
    });
    this.socket.on("auth_redirect", () => this.router.navigate(["/login"]));
    this.socket.on("disconnect", () => this.onDisconnect.emit());
    this.socket.on("toast_message", (data) => this.onToastMessage.emit(data));
  }

  getBaseUrl() {
    return environment.apiUrl;
  }

  getSocketId(): string {
    return this.socket.id;
  }

  reconnect(): void {
    this.socket.disconnect();
    this.socket.connect();
  }

  uploadFile(
    files: any,
    url: string,
    conversationId: number,
    path: string = "",
    callback: any = null
  ) {
    if (files && files[0]) {
      const formData = new FormData();
      formData.append("file", files[0]);
      const headers = new HttpHeaders({
        Authorization: this.getToken(),
      });
      const postUrl =
        this.getBaseUrl() +
        url +
        "?socket_id=" +
        encodeURI(this.socket.id) +
        "&conversation_id=" +
        encodeURI("" + conversationId) +
        "&path=" +
        encodeURI(path);
      this.http.post(postUrl, formData, { headers }).subscribe(
        (response) => {
          if (callback) {
            callback(response);
          }
        },
        (error) => {
          if (callback) callback(null, error);
          this.onToastMessage.emit({
            summary: `Error uploading file`,
            detail: error.error.message,
            severity: "error",
          });
        }
      );
    }
  }

  private filterEventEmitters: {
    [eventName: string]: { [filterKey: string]: FilterDetail[] };
  } = {};

  private eventEmitters: {
    [eventName: string]: EventEmitter<any>;
  } = {};

  private eventRegistered: { [eventName: string]: boolean } = {};

  private handleSocketOn(eventName: string) {
    if (this.eventRegistered[eventName]) {
      return;
    }
    this.eventRegistered[eventName] = true;

    // Listen for the event from the server
    this.socket.on(eventName, (data: any) => {
      if (this.filterEventEmitters[eventName]) {
        for (const filterName in this.filterEventEmitters[eventName]) {
          const currentFilter = this.filterEventEmitters[eventName][filterName];
          if (!data[filterName]) {
            continue;
          }

          for (let i = 0; i < currentFilter.length; i++) {
            if (currentFilter[i].filter === data[filterName]) {
              currentFilter[i].emitter.emit(data);
            }
          }
        }
      }

      if (this.eventEmitters[eventName]) {
        this.eventEmitters[eventName].emit(data);
      }
    });
  }

  getToken(): string {
    if (!this.token) {
      this.token =
        typeof localStorage.getItem("auth_token") == "string"
          ? `Bearer ${localStorage.getItem("auth_token")}`
          : "";
    }
    return this.token;
  }

  subscribeToEventWithFilter(
    eventName: string,
    filterKey: string,
    filterValue: any,
    callback: (data: any) => void
  ) {
    // Create an object for the eventName if it doesn't exist yet
    if (!this.filterEventEmitters[eventName]) {
      this.filterEventEmitters[eventName] = {};
    }

    if (!this.filterEventEmitters[eventName][filterKey]) {
      this.filterEventEmitters[eventName][filterKey] = [];
    }

    // look for already setup emitter
    let emitter = null;
    const currentFilters = this.filterEventEmitters[eventName][filterKey];
    for (let i = 0; i < currentFilters.length; i++) {
      const currentFilter = currentFilters[i];
      if (currentFilter.filter === filterValue) {
        emitter = currentFilter.emitter;
        break;
      }
    }

    if (!emitter) {
      emitter = new EventEmitter<any>();
      this.filterEventEmitters[eventName][filterKey].push({
        filter: filterValue,
        emitter: emitter,
      });
    }

    const ret = emitter.subscribe(callback);
    this.handleSocketOn(eventName);
    return ret;
  }

  subscribeToEvent(eventName: string, callback: (data: any) => void) {
    if (!this.eventEmitters[eventName]) {
      this.eventEmitters[eventName] = new EventEmitter<any>();
    }
    this.handleSocketOn(eventName);
    return this.eventEmitters[eventName].subscribe(callback);
  }

  send(event: string, data: any) {
    this.socket.emit(event, data, {
      extraHeaders: {
        authorization: this.getToken(),
      },
    });
  }
}
