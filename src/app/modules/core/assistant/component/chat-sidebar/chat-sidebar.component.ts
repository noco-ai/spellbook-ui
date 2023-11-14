import { Component, OnInit } from "@angular/core";
import { Conversation } from "../../api/conversation";
import { AssistantService } from "../../service/assistant.service";

@Component({
  selector: "app-chat-sidebar",
  templateUrl: "./chat-sidebar.component.html",
  styleUrls: ["./chat-sidebar.component.scss"],
})
export class ChatSidebarComponent implements OnInit {
  searchValue: string = "";
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  filteredConversations: Conversation[] = [];

  constructor(private chatService: AssistantService) {}

  ngOnInit(): void {
    this.chatService.conversationList.subscribe((conversations) => {
      this.conversations = conversations;
      this.filteredConversations = conversations;

      const lastId = localStorage.getItem("last-conversation");
      if (!lastId) return;
      const lastIdInt = parseInt(lastId);
      if (
        this.selectedConversation &&
        this.selectedConversation.id == lastIdInt
      )
        return;
      for (let i = 0; i < conversations.length; i++) {
        if (conversations[i].id == lastIdInt) {
          this.changeView(conversations[i]);
          break;
        }
      }
    });
    this.chatService.getConversations();

    this.chatService.conversationMessages.subscribe((messages) => {
      if (!this.selectedConversation) return;
      this.selectedConversation.messages = messages;
      this.chatService.changeActiveChat(this.selectedConversation);
    });
  }

  newConversation() {
    this.chatService.resetConversation();
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
    localStorage.setItem("last-conversation", `${conversation.id}`);
    this.chatService.getConversationMessages(conversation.id);
  }
}
