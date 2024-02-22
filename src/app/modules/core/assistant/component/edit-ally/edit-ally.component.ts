import { Component, OnDestroy, OnInit } from "@angular/core";
import { AssistantService } from "../../service/assistant.service";
import { DigitalAlly } from "../../api/digital-allies";
import { Subscription } from "rxjs";
import { GeneratedImage } from "src/app/modules/apps/image-generator/api/generated-image";
import { ActivatedRoute } from "@angular/router";
import { ModelOptions } from "../../api/model-options";
import { ConfirmationService } from "primeng/api";

@Component({
  templateUrl: "./edit-ally.component.html",
  styleUrls: ["./edit-ally.component.scss"],
  providers: [ConfirmationService],
})
export class EditAllyComponent implements OnInit, OnDestroy {
  showEdit: boolean = false;
  digitalAllies: DigitalAlly[] = [];
  currentAllyId: number = 0;
  currentAlly!: DigitalAlly;
  emptyAlly: DigitalAlly = {
    id: 0,
    user_id: 0,
    created_at: new Date(),
    updated_at: new Date(),
    name: "",
    sort_order: 100,
    min_p: 0.05,
    top_k: 50,
    top_p: 0.9,
    temperature: 1,
    seed: -1,
    mirostat: 0,
    mirostat_eta: 0.1,
    mirostat_tau: 5,
    loaded_tones: [],
    character_image: "asset/spellbook/core/ally-placeholder.png",
    location_image: "asset/spellbook/core/location-placeholder.jpeg",
    router_config:
      "name_conversation,fact_check,wake_words,auto_tts,auto_asr,function_calling,model_routing,pin_functions,pin_models",
  };
  allySubscription!: Subscription;
  imagesSubscription!: Subscription;
  llmModelsSubscription!: Subscription;
  voiceSubscription!: Subscription;
  characterImages: any[] = [];
  locationImages: any[] = [];
  mirostatOptions = this.chatService.getMirostatOptions();
  llmModelOptions: ModelOptions[] = [];
  voiceOptions: ModelOptions[] = [];
  optionStates: { [key: string]: boolean } = {};
  conversationTone: any[] = [];

  constructor(
    private chatService: AssistantService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService
  ) {}

  ngOnDestroy(): void {
    this.llmModelsSubscription.unsubscribe();
    this.allySubscription.unsubscribe();
    this.imagesSubscription.unsubscribe();
    this.voiceSubscription.unsubscribe();
  }

  selectCharacterImage(image: GeneratedImage) {
    this.currentAlly.character_image = image.image_url;
  }

  goBack() {
    window.location.href = "#/ai-assistant/allies";
  }

  addTone() {
    if (this.conversationTone.length >= 4) return;
    this.conversationTone.push({ user: "", assistant: "" });
  }

  removeTone() {
    if (this.conversationTone.length == 0) return;
    this.conversationTone.splice(this.conversationTone.length - 1, 1);
  }

  selectLocationImage(image: GeneratedImage) {
    this.currentAlly.location_image = image.image_url;
  }

  isOptionToggled(optionName: string) {
    return this.currentAlly.router_config?.split(",").includes(optionName)
      ? true
      : false;
  }

  toggleConversationOption(optionName: string) {
    if (this.currentAlly.router_config?.split(",").includes(optionName)) {
      this.optionStates[optionName] = false;
      const arr = this.currentAlly.router_config?.split(",") || [];
      const index = arr.indexOf(optionName);
      arr.splice(index, 1);
      this.currentAlly.router_config = arr.join(",");
    } else {
      this.optionStates[optionName] = true;
      const upd = this.currentAlly.router_config?.split(",") || [];
      upd.push(optionName);
      this.currentAlly.router_config = upd.join(",");
    }
  }

  updateToggleStates() {
    const checkStates = [
      "name_conversation",
      "fact_check",
      "wake_words",
      "auto_tts",
      "auto_asr",
      "function_calling",
      "model_routing",
      "pin_functions",
      "pin_models",
    ];

    for (let j = 0; j < checkStates.length; j++) {
      this.optionStates[checkStates[j]] = this.isOptionToggled(checkStates[j]);
    }
  }

  getImagesForUser(userId: number, skip?: string): { image_url: string }[] {
    const imagesKey = `user-location-${userId}`;
    const existingImagesJson = localStorage.getItem(imagesKey);
    const existingImages: string[] = existingImagesJson
      ? JSON.parse(existingImagesJson)
      : [];
    const filteredImages = existingImages.filter((imagePath) => {
      return skip !== undefined ? imagePath !== skip : true;
    });
    const imagesObjects: { image_url: string }[] = filteredImages.map(
      (imagePath) => ({
        image_url: imagePath,
      })
    );
    return imagesObjects;
  }

  ngOnInit(): void {
    this.llmModelsSubscription =
      this.chatService.onlineLanguageModels.subscribe(
        (models: ModelOptions[]) => {
          this.llmModelOptions = models;
        }
      );
    this.chatService.getOnlineLanguageModels();

    this.allySubscription = this.chatService.digitalAllies.subscribe(
      (allies: DigitalAlly[]) => {
        this.digitalAllies = allies;
        for (let i = 0; i < allies.length; i++) {
          if (allies[i].id == this.currentAllyId) {
            this.currentAlly = allies[i];
            console.log(this.currentAlly);
            this.chatService.getAvailableImages();
            this.updateToggleStates();
            this.conversationTone = JSON.parse(
              this.currentAlly.conversation_tone || "[]"
            );
            break;
          }
        }
      }
    );

    this.imagesSubscription = this.chatService.imageList.subscribe(
      (images: GeneratedImage[]) => {
        const locationImages = this.getImagesForUser(
          this.currentAlly.user_id,
          this.currentAlly.location_image
        );

        if (
          this.currentAlly.location_image &&
          this.currentAlly.location_image.indexOf("library") !== -1 &&
          this.currentAlly.location_image !=
            "asset/spellbook/core/location-placeholder.jpeg"
        ) {
          this.locationImages = [
            { image_url: "asset/spellbook/core/location-placeholder.jpeg" },
            { image_url: this.currentAlly.location_image },
            ...locationImages,
            ...images,
          ];
        } else {
          this.locationImages = [
            { image_url: "asset/spellbook/core/location-placeholder.jpeg" },
            ...locationImages,
            ...images,
          ];
          console.log(this.locationImages);
        }

        if (
          this.currentAlly.character_image &&
          this.currentAlly.character_image.indexOf("digital-ally") !== -1 &&
          this.currentAlly.character_image !=
            "asset/spellbook/core/ally-placeholder.png"
        ) {
          this.characterImages = [
            { image_url: "asset/spellbook/core/ally-placeholder.png" },
            { image_url: this.currentAlly.character_image },
            ...images,
          ];
        } else {
          this.characterImages = [
            { image_url: "asset/spellbook/core/ally-placeholder.png" },
            ...images,
          ];
        }
      }
    );

    this.voiceSubscription = this.chatService.voiceFiles.subscribe(
      async (files: any[]) => {
        this.voiceOptions = files;
      }
    );
    this.chatService.getVoiceFiles();

    this.route.paramMap.subscribe((params) => {
      const id = parseInt(params.get("id") || "0");
      if (!id) {
        this.currentAlly = JSON.parse(JSON.stringify(this.emptyAlly));
        this.updateToggleStates();
        this.chatService.getAvailableImages();
        return;
      }
      this.currentAllyId = id;
      this.chatService.getDigitalAllies();
    });
  }

  getImageUrl(url: string | undefined) {
    return this.chatService.getBaseUrl() + url;
  }

  saveAlly(ally: DigitalAlly) {
    ally.conversation_tone = JSON.stringify(this.conversationTone);
    ally.sort_order = Number(ally.sort_order) || 0;
    this.chatService.updateDigitalAlly(ally, () => {
      this.goBack();
    });
  }

  deleteAlly(ally: DigitalAlly) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete ally ${ally.name}?`,
      icon: `pi pi-icon-trash`,
      accept: () => {
        this.chatService.deleteDigitalAlly(ally.id, (data: any) => {
          this.goBack();
        });
      },
      reject: () => {},
    });
  }

  toggleEdit() {
    this.showEdit = !this.showEdit ? true : false;
  }
}
