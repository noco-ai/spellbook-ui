import { Injectable, EventEmitter } from "@angular/core";
import { SocketService } from "src/app/service/sockets.service";
import { GeneratedImageSettings } from "../api/generated-image-settings";
import { GeneratedImage } from "../api/generated-image";
import { GraphqlService } from "src/app/service/graphql.service";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import { ProgressUpdate } from "src/app/modules/core/assistant/api/progress-update";

@Injectable({
  providedIn: "root",
})
export class ImageGeneratorService {
  generatedImage: EventEmitter<GeneratedImage> =
    new EventEmitter<GeneratedImage>();
  imageList: EventEmitter<GeneratedImage[]> = new EventEmitter<
    GeneratedImage[]
  >();
  modelList: EventEmitter<ModelOptions[]> = new EventEmitter<ModelOptions[]>();
  progressBarUpdate: EventEmitter<ProgressUpdate> =
    new EventEmitter<ProgressUpdate>();

  constructor(
    private socketService: SocketService,
    private graphqlService: GraphqlService
  ) {
    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_image_generator",
      (data) => {
        this.generatedImage.emit(data);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_online_skills",
      (resp) => {
        const emitList =
          !resp.skills || !resp.skills["image_generation"]
            ? []
            : resp.skills["image_generation"];
        this.modelList.emit(emitList);
      }
    );

    this.socketService.subscribeToEvent(
      "progress_bar_update",
      (data: ProgressUpdate) => {
        this.progressBarUpdate.emit(data);
      }
    );
  }

  async getOnlineImageGenerators() {
    await this.socketService.send("command", {
      command: "get_online_skills",
    });
  }

  async generateImage(imageData: GeneratedImageSettings) {
    await this.socketService.send("command", {
      command: "app_image_generator",
      settings: imageData,
    });
  }

  async getGeneratedImages() {
    const query = `query { getGeneratedImage { id, prompt, negative_prompt, seed, height, width, guidance_scale, steps, image_url, created_at, model_name } }`;
    this.graphqlService.sendQuery(query, {}).subscribe((data) => {
      const images: GeneratedImage[] = data.data.getGeneratedImage;
      this.imageList.emit(images);
    });
  }

  async deleteGeneratedImage(id: number) {
    const query = `mutation GeneratedImageDelete($id: Int!) { deleteGeneratedImage(id: $id) { id } }`;
    this.graphqlService.sendQuery(query, { id: id }).subscribe((data) => {
      this.getGeneratedImages();
    });
  }

  getBaseUrl() {
    return this.socketService.getBaseUrl();
  }
}
