import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Conversation } from "../../api/conversation";
import { AssistantService } from "../../service/assistant.service";
import { DigitalAlly } from "../../api/digital-allies";
import { ActivatedRoute } from "@angular/router";
import { Subscribable, Subscription } from "rxjs";

@Component({
  selector: "app-chat-sidebar",
  templateUrl: "./chat-sidebar.component.html",
  styleUrls: ["./chat-sidebar.component.scss"],
})
export class ChatSidebarComponent implements OnInit, OnDestroy {
  searchValue: string = "";
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  filteredConversations: Conversation[] = [];
  allyId: number = 0;
  conversationSubscription!: Subscription;
  messagesSubscription!: Subscription;
  @Input() ally!: DigitalAlly;

  constructor(
    private chatService: AssistantService,
    private route: ActivatedRoute
  ) {}

  ngOnDestroy(): void {
    this.conversationSubscription.unsubscribe();
    this.messagesSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.conversationSubscription = this.chatService.conversationList.subscribe(
      (conversations) => {
        this.conversations = conversations;
        this.filteredConversations = conversations;

        const lastId = Number(
          localStorage.getItem(`last-conversation-${this.allyId}`) || 0
        );
        if (this.selectedConversation && this.selectedConversation.id == lastId)
          return;
        for (let i = 0; i < conversations.length; i++) {
          if (
            conversations[i].id == lastId &&
            conversations[i].ally_id == this.allyId
          ) {
            this.changeView(conversations[i]);
            return;
          }
        }
      }
    );

    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      this.chatService.getConversations(id);
      this.allyId = id;
    });

    this.messagesSubscription = this.chatService.conversationMessages.subscribe(
      (messages) => {
        if (!this.selectedConversation) return;
        this.selectedConversation.messages = messages;
        this.chatService.changeActiveChat(this.selectedConversation);
      }
    );
  }

  newConversation() {
    this.chatService.resetConversation(this.ally);
    localStorage.removeItem(`last-conversation-${this.allyId}`);
  }

  filter() {
    let filtered: Conversation[] = [];
    for (let i = 0; i < this.conversations.length; i++) {
      let conversation = this.conversations[i];
      if (
        conversation.topic
          .toLowerCase()
          .indexOf(this.searchValue.toLowerCase()) == 0
      ) {
        filtered.push(conversation);
      }
    }

    this.filteredConversations = [...filtered];
  }

  formatTimestamp(timestamp: any): string {
    let date = new Date(parseInt(timestamp));
    let day = String(date.getDate()).padStart(2, "0");
    let month = String(date.getMonth() + 1).padStart(2, "0");
    let year = String(date.getFullYear()).substr(2);
    let formattedDate = month + "/" + day + "/" + year;
    return formattedDate;
  }

  changeView(conversation: Conversation) {
    this.selectedConversation = conversation;
    localStorage.setItem(
      `last-conversation-${this.allyId}`,
      `${conversation.id}`
    );
    this.chatService.getConversationMessages(
      conversation.id,
      conversation.first_message_id
    );
  }
}
