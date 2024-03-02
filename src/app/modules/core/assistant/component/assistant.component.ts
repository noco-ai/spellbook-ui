import { Component, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { Conversation } from "../api/conversation";
import { AssistantService } from "../service/assistant.service";
import { SocketService } from "../../../../service/sockets.service";
import { ActivatedRoute } from "@angular/router";
import { DigitalAlly } from "../api/digital-allies";

@Component({
  templateUrl: "./assistant.component.html",
})
export class ChatAppComponent implements OnDestroy {
  private subscription!: Subscription;
  private allySubscription!: Subscription;
  private connectSubscription!: Subscription;
  private disconnectSubscription!: Subscription;
  sidebarVisible: boolean = false;
  activeConversation!: Conversation;
  activeAlly!: DigitalAlly;
  allyId: number = 0;
  wakeWords: string[] = [];

  constructor(
    private chatService: AssistantService,
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  showSidebar(value: boolean) {
    this.sidebarVisible = true;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      if (!id) return;
      this.allyId = id;
      this.chatService.getDigitalAllies();
    });

    this.subscription = this.chatService.activeConversation$.subscribe(
      (conversation: Conversation) => {
        this.activeConversation = conversation;
        this.sidebarVisible = false;
        if (conversation.id == 0 && this.activeAlly) {
          conversation.min_p = this.activeAlly.min_p || conversation.min_p;
          conversation.top_k = this.activeAlly.top_k || conversation.top_k;
          conversation.use_model =
            this.activeAlly.use_model || conversation.use_model;
          conversation.mirostat =
            this.activeAlly.mirostat || conversation.mirostat;
          conversation.mirostat =
            this.activeAlly.mirostat || conversation.mirostat;
          conversation.mirostat =
            this.activeAlly.mirostat || conversation.mirostat;
          conversation.top_p = this.activeAlly.top_p || conversation.top_p;
          conversation.seed = this.activeAlly.seed || conversation.seed;
          conversation.system_message =
            this.activeAlly.system_message || conversation.system_message;
          conversation.temperature =
            this.activeAlly.temperature || conversation.temperature;
          conversation.router_config =
            this.activeAlly.router_config?.split(",") ||
            conversation.router_config;
        }
      }
    );

    this.allySubscription = this.chatService.digitalAllies.subscribe(
      (allies: DigitalAlly[]) => {
        let wakeWords: string[] = [];
        for (let i = 0; i < allies.length; i++) {
          let words = allies[i].wake_words?.split(",") || [];
          words = words.map((word) => `${word}:${allies[i].id}`);
          if (words.length) wakeWords = [...wakeWords, ...words];
          if (allies[i].id == this.allyId) this.activeAlly = allies[i];
        }
        wakeWords = wakeWords.map((word) => word.toUpperCase());
        this.wakeWords = wakeWords;
      }
    );

    this.connectSubscription = this.socketService.onConnect.subscribe(() => {});
    this.disconnectSubscription = this.socketService.onDisconnect.subscribe(
      () => {}
    );
  }

  ngOnDestroy(): void {
    this.connectSubscription.unsubscribe();
    this.allySubscription.unsubscribe();
    this.disconnectSubscription.unsubscribe();
    this.subscription.unsubscribe();
  }
}
