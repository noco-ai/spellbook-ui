import { Component, OnDestroy, OnInit } from "@angular/core";
import { AssistantService } from "../../service/assistant.service";
import { DigitalAlly } from "../../api/digital-allies";
import { Subscription } from "rxjs";

@Component({
  templateUrl: "./digital-allies.component.html",
  styleUrls: ["./digital-allies.component.scss"],
})
export class DigitalAlliesComponent implements OnInit, OnDestroy {
  listView: boolean = false;
  digitalAllies: DigitalAlly[] = [];
  allySubscription!: Subscription;

  constructor(private chatService: AssistantService) {}

  ngOnDestroy(): void {
    this.allySubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.allySubscription = this.chatService.digitalAllies.subscribe(
      (allies: DigitalAlly[]) => {
        this.digitalAllies = allies;
        if (!allies.length) window.location.href = `#/ai-assistant/edit-ally/0`;
      }
    );
    this.chatService.getDigitalAllies();
  }

  getImageUrl(url: string | undefined) {
    return this.chatService.getBaseUrl() + url;
  }

  editAlly($event: Event, ally: DigitalAlly) {
    $event.stopPropagation();
    window.location.href = `#/ai-assistant/edit-ally/${ally.id}`;
  }

  createAlly() {
    window.location.href = `#/ai-assistant/edit-ally/0`;
  }

  chatWithAlly($event: Event, ally: DigitalAlly) {
    $event.stopPropagation();
    window.location.href = `#/ai-assistant/${ally.id}`;
  }

  toggleListView() {
    this.listView = !this.listView ? true : false;
  }
}
