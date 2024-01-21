import { Component, OnDestroy, OnInit } from "@angular/core";
import { Conversation } from "../../api/conversation";
import { AssistantService } from "../../service/assistant.service";
import { DigitalAlly } from "../../api/digital-allies";
import { Subscription } from "rxjs";
import { GeneratedImage } from "src/app/modules/apps/image-generator/api/generated-image";

@Component({
  //selector: "app-chat-sidebar",
  templateUrl: "./edit-ally.component.html",
  styleUrls: ["./edit-ally.component.scss"],
})
export class EditAllyComponent implements OnInit, OnDestroy {
  listView: boolean = false;
  showEdit: boolean = false;
  digitalAllies: DigitalAlly[] = [];
  currentAlly: DigitalAlly = {
    id: 0,
    user_id: 0,
    created_at: new Date(),
    updated_at: new Date(),
    name: "YaYa",
  };
  allySubscription!: Subscription;
  imagesSubscription!: Subscription;
  characterImages: GeneratedImage[] = [];
  locationImages: GeneratedImage[] = [];
  mirostatOptions = this.chatService.getMirostatOptions();
  modelOptions: any[] = [];

  constructor(private chatService: AssistantService) {}

  ngOnDestroy(): void {}

  selectCharacterImage(image: GeneratedImage) {
    console.log(image);
  }

  ngOnInit(): void {
    this.allySubscription = this.chatService.digitalAllies.subscribe(
      (allies: DigitalAlly[]) => {
        this.digitalAllies = allies;
      }
    );

    this.imagesSubscription = this.chatService.imageList.subscribe(
      (images: GeneratedImage[]) => {
        this.locationImages = images;
        this.characterImages = [...images, ...images, ...images];
      }
    );
    this.chatService.getAvailableImages();

    this.chatService.conversationList.subscribe((conversations) => {
      //this.conversations = conversations;
      //this.filteredConversations = conversations;
      /*const lastId = localStorage.getItem("last-conversation");
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
      }*/
    });
    //this.chatService.getConversations();

    this.chatService.conversationMessages.subscribe((messages) => {
      //if (!this.selectedConversation) return;
      //this.selectedConversation.messages = messages;
      //this.chatService.changeActiveChat(this.selectedConversation);
    });

    this.chatService.getDigitalAllies();
  }

  getImageUrl(url: string | undefined) {
    return this.chatService.getBaseUrl() + url;
  }

  editAlly(ally: DigitalAlly) {
    console.log("edit");
    console.log(ally);
  }

  chatWithAlly(ally: DigitalAlly) {
    console.log("chat");
    console.log(ally);
  }

  toggleEdit() {
    this.showEdit = !this.showEdit ? true : false;
  }

  toggleListView() {
    this.listView = !this.listView ? true : false;
  }
}
