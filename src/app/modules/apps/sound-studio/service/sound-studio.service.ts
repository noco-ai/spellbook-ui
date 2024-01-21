import { Injectable, EventEmitter } from "@angular/core";
import { SocketService } from "src/app/service/sockets.service";
import { GraphqlService } from "src/app/service/graphql.service";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import { ProgressUpdate } from "src/app/modules/core/assistant/api/progress-update";

@Injectable({
  providedIn: "root",
})
export class SoundStudioService {
  stopJobFinished: EventEmitter<string> = new EventEmitter<string>();
  soundFiles: EventEmitter<any[]> = new EventEmitter<any[]>();
  ttsModelList: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  asrModelList: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  generationModelList: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  progressBarUpdate: EventEmitter<ProgressUpdate> =
    new EventEmitter<ProgressUpdate>();
  generationFinished: EventEmitter<any> = new EventEmitter<any>();
  asrProcessingFinished: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private socketService: SocketService,
    private graphqlService: GraphqlService
  ) {
    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_sound_studio_process_asr",
      (data) => {
        this.asrProcessingFinished.emit(data);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_sound_studio_generate",
      (data) => {
        this.generationFinished.emit(data);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "get_online_skills",
      (resp) => {
        const ttsList =
          !resp.skills || !resp.skills["text_to_speech"]
            ? []
            : resp.skills["text_to_speech"];
        const asrList =
          !resp.skills || !resp.skills["automatic_speech_recognition"]
            ? []
            : resp.skills["automatic_speech_recognition"];
        const soundList =
          !resp.skills || !resp.skills["music_generation"]
            ? []
            : resp.skills["music_generation"];
        this.ttsModelList.emit(ttsList);
        this.asrModelList.emit(asrList);
        this.generationModelList.emit(soundList);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "progress_bar_update",
      "target",
      "app_sound_studio_generate",
      (data: ProgressUpdate) => {
        this.progressBarUpdate.emit(data);
      }
    );
  }

  async getOnlineSoundModels() {
    await this.socketService.send("command", {
      command: "get_online_skills",
    });
  }

  async generateSound(
    prompt: string,
    models: string[],
    type: string,
    options: any = {}
  ) {
    this.socketService.send("command", {
      command: "app_sound_studio_generate",
      prompt: prompt,
      type: type,
      models: models,
      options: options,
    });
  }

  async getSoundFiles(type: string) {
    const query = `query SoundFile($type: String!) { getSoundFiles(type: $type) { id, filepath, filename, text, model_used, label } }`;
    this.graphqlService.sendQuery(query, { type: type }).subscribe((data) => {
      const files: any[] = data.data.getSoundFiles;
      this.soundFiles.emit(files);
    });
  }

  async deleteSoundFile(id: number, type: string) {
    const query = `mutation SoundFileDelete($id: Int!) { deleteSoundFile(id: $id) { id } }`;
    this.graphqlService.sendQuery(query, { id: id }).subscribe((data) => {
      this.getSoundFiles(type);
    });
  }

  async updateSoundFileLabel(id: number, label: string) {
    const query = `mutation SoundFileUpdateLabel($id: Int!, $label: String!) { updateSoundFileLabel(id: $id, label: $label) { id } }`;
    this.graphqlService
      .sendQuery(query, { id: id, label: label })
      .subscribe((data) => {
        this.getSoundFiles("asr");
        console.log(data);
      });
  }

  getBaseUrl() {
    return this.socketService.getBaseUrl();
  }

  processAsrUpload(filename: string, useModels: string[]) {
    this.socketService.send("command", {
      command: "app_sound_studio_process_asr_upload",
      filename: filename,
      use_models: useModels,
    });
  }

  private async blobToBase64(blob: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async sendAsrWav(blob: any, fileType: string, useModels: string[]) {
    const encodedBlob = await this.blobToBase64(blob);
    this.socketService.send("command", {
      command: "app_sound_studio_asr_wav",
      wav: encodedBlob,
      file_type: fileType,
      use_models: useModels,
    });
  }
}
