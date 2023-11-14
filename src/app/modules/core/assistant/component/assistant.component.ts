import { Component, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { Conversation } from "../api/conversation";
import { AssistantService } from "../service/assistant.service";
import { SocketService } from "../../../../service/sockets.service";

@Component({
  templateUrl: "./assistant.component.html",
})
export class ChatAppComponent implements OnDestroy {
  private subscription!: Subscription;
  private connectSubscription!: Subscription;
  private disconnectSubscription!: Subscription;
  sidebarVisible: boolean = false;
  activeConversation!: Conversation;

  constructor(
    private chatService: AssistantService,
    private socketService: SocketService
  ) {}

  showSidebar(value: boolean) {
    this.sidebarVisible = true;
  }

  ngOnInit(): void {
    this.subscription = this.chatService.activeConversation$.subscribe(
      (conversation: Conversation) => {
        this.activeConversation = conversation;
        this.sidebarVisible = false;
      }
    );

    this.connectSubscription = this.socketService.onConnect.subscribe(() => {});

    this.disconnectSubscription = this.socketService.onDisconnect.subscribe(
      () => {}
    );
  }

  ngOnDestroy(): void {
    this.connectSubscription.unsubscribe();
    this.disconnectSubscription.unsubscribe();
    this.subscription.unsubscribe();
  }
}
