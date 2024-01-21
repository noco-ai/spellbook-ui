import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { ConfirmationService, Message, MessageService } from "primeng/api";
import { ImageGeneratorService } from "../service/image-generator.service";
import { GeneratedImage } from "../api/generated-image";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import { ProgressUpdate } from "src/app/modules/core/assistant/api/progress-update";

@Component({
  templateUrl: "./image-generator.component.html",
  styleUrls: ["./image-generator.component.scss"],
  providers: [ConfirmationService, MessageService],
})
export class ImageGeneratorComponent implements OnInit, OnDestroy {
  updateSubscription!: Subscription;
  progressSubscription!: Subscription;
  listSubscription!: Subscription;
  modelsSubscription!: Subscription;
  imagePrompt: string = "";
  negativePrompt: string = "";
  guidanceScale: number = 7.5;
  height: number = 1024;
  width: number = 1024;
  steps: number = 40;
  seed: number = -1;
  numGenerations: number = 1;
  images!: any[];
  rawImages!: GeneratedImage[];
  activeImageIndex: number = 0;
  activeImage!: GeneratedImage;
  modelOptions!: ModelOptions[];
  useModels: string[] = [];
  stepCounts: Map<string, number>;
  progressValue: number = 0;
  progressVisible: boolean = false;
  progressAllSteps: number = 0;
  numGenerated: number = 0;
  numToGenerated: number = 0;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private imageService: ImageGeneratorService
  ) {
    this.stepCounts = new Map();
  }

  galleriaResponsiveOptions: any[] = [
    {
      breakpoint: "1024px",
      numVisible: 5,
    },
    {
      breakpoint: "960px",
      numVisible: 4,
    },
    {
      breakpoint: "768px",
      numVisible: 3,
    },
    {
      breakpoint: "560px",
      numVisible: 1,
    },
  ];

  async generateImage() {
    this.stepCounts.clear();
    for (let i = 0; i < this.useModels.length; i++) {
      this.stepCounts.set(this.useModels[i], this.steps);
    }
    this.progressAllSteps = 0;
    this.numGenerated = 0;
    this.numToGenerated = this.useModels.length * this.numGenerations;

    await this.imageService.generateImage({
      prompt: this.imagePrompt,
      guidance_scale: this.guidanceScale,
      negative_prompt: this.negativePrompt,
      height: this.height,
      width: this.width,
      steps: this.steps,
      use_models: this.useModels,
      num_generations: this.numGenerations,
      seed: this.seed,
    });
  }

  onThumbnailClick(item: any) {
    this.activeImage = this.rawImages[item.index];
  }

  onChangeNumGenerations() {
    if (this.numGenerations > 1 && "" + this.seed != "-1") this.seed = -1;
  }

  cloneSettings() {
    this.imagePrompt = this.activeImage.prompt;
    this.negativePrompt = this.activeImage.negative_prompt;
    this.height = this.activeImage.height;
    this.width = this.activeImage.width;
    this.guidanceScale = this.activeImage.guidance_scale;
    this.steps = this.activeImage.steps;
    this.seed = this.activeImage.seed;
  }

  handlePromptKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      if (event.shiftKey || event.altKey) {
        this.imagePrompt += "\n";
        event.preventDefault();
      } else {
        if (this.useModels.length) this.generateImage();
        event.preventDefault();
      }
    }
  }

  async deleteImage() {
    if (!this.images[this.activeImageIndex]) return;
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete this image?`,
      icon: `pi trash`,
      accept: () => {
        this.imageService.deleteGeneratedImage(
          this.images[this.activeImageIndex].id
        );
      },
      reject: () => {},
    });
  }

  downloadImage() {
    if (!this.images[this.activeImageIndex]) return;
    const imageUrl = this.images[this.activeImageIndex].itemImageSrc;
    const imageId = this.images[this.activeImageIndex].id;
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        var url = window.URL.createObjectURL(blob);
        var downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = `generated-image-${imageId}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        window.URL.revokeObjectURL(url);
        downloadLink.remove();
      })
      .catch((error) => console.error("Error:", error));
  }

  ngOnDestroy(): void {
    this.updateSubscription.unsubscribe();
    this.listSubscription.unsubscribe();
    this.modelsSubscription.unsubscribe();
    this.progressSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.modelsSubscription = this.imageService.modelList.subscribe(
      (models: ModelOptions[]) => {
        this.useModels = [];
        for (let i = 0; i < models.length; i++)
          this.useModels.push(models[i].value);
        this.modelOptions = models;
      }
    );

    this.progressSubscription = this.imageService.progressBarUpdate.subscribe(
      (progressUpdate: ProgressUpdate) => {
        if (this.stepCounts.has(progressUpdate.model)) {
          this.stepCounts.set(progressUpdate.model, progressUpdate.total);
        }

        let totalSteps = 0;
        this.stepCounts.forEach(
          (value: number, key: string, map: Map<string, number>) => {
            totalSteps += value * this.numGenerations;
          }
        );
        this.progressAllSteps++;
        this.progressVisible = true;
        this.progressValue = (this.progressAllSteps / totalSteps) * 100;
      }
    );

    this.listSubscription = this.imageService.imageList.subscribe(
      (images: GeneratedImage[]) => {
        let imagesNew = [];
        images = images.reverse();
        for (let i = 0; i < images.length; i++) {
          imagesNew.push({
            itemImageSrc: this.imageService.getBaseUrl() + images[i].image_url,
            thumbnailImageSrc:
              this.imageService.getBaseUrl() +
              images[i].image_url.replace(".png", "-thumb.png"),
            alt: images[i].prompt,
            title: "",
            id: images[i].id,
            index: i,
          });
        }

        if (imagesNew.length < 3) {
          this.addPlaceHolders(3 - imagesNew.length, imagesNew);
        }

        this.images = imagesNew;
        this.rawImages = images;
        this.activeImageIndex = 0;
        this.activeImage = images[this.activeImageIndex];
      }
    );
    this.imageService.getGeneratedImages();

    this.updateSubscription = this.imageService.generatedImage.subscribe(
      (image: any) => {
        if (++this.numGenerated >= this.numToGenerated) {
          this.progressVisible = false;
        }
        if (!image.success) {
          this.messageService.add({
            severity: "error",
            summary: "Image Generation Error",
            detail: image.error,
          });
        }
        this.imageService.getGeneratedImages();
      }
    );

    this.imageService.getOnlineImageGenerators();
  }

  addPlaceHolders(numPlaceHolders: number, images: any[]) {
    for (let i = 0; i < numPlaceHolders; i++) {
      images.push({
        itemImageSrc:
          this.imageService.getBaseUrl() +
          "asset/app/image-generator/placeholder.png",
        thumbnailImageSrc:
          this.imageService.getBaseUrl() +
          "asset/app/image-generator/placeholder-thumb.png",
      });
    }
  }
}
