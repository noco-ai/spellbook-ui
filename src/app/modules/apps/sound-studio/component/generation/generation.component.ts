import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { ConfirmationService, MessageService } from "primeng/api";
import { SoundStudioService } from "../../service/sound-studio.service";
import { Subscription } from "rxjs";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import WaveSurfer from "wavesurfer.js";
import { SoundService } from "src/app/service/sound.service";

@Component({
  selector: "app-generation",
  templateUrl: "./generation.component.html",
  styleUrls: ["./generation.component.scss"],
})
export class GenerationComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private soundService: SoundStudioService,
    private audioService: SoundService
  ) {}

  ngOnDestroy(): void {
    this.ttsModelsSubscription.unsubscribe();
    this.filesSubscription.unsubscribe();
    this.generationSubscription.unsubscribe();
    this.progressSubscription.unsubscribe();
    this.wavesurfer.destroy();
  }

  ngAfterViewInit(): void {
    this.wavesurfer = WaveSurfer.create({
      container: `#waveform-${this.type}`,
      waveColor: this.getCssVariableValue("--primary-color"),
      progressColor: this.getCssVariableValue("--primary-color"),
    });

    this.wavesurfer.empty();
    this.wavesurfer.on("finish", () => {
      this.isPlaying = false;
    });
  }

  ngOnInit(): void {
    // bark voices
    for (let i = 0; i < 10; i++) {
      this.barkVoiceOptions.push({
        label: `Voice #${i + 1}`,
        value: `v2/en_speaker_${i}`,
      });
    }

    this.progressSubscription = this.soundService.progressBarUpdate.subscribe(
      (data) => {
        if (this.type == "tts") return;
        const percent = Math.floor((data.current / data.total) * 100);
        this.progressValue = percent;
        this.progressVisible = true;
      }
    );

    this.filesSubscription = this.soundService.soundFiles.subscribe(
      async (files: any[]) => {
        if (this.fetchType == "asr") {
          this.xttsOptions = [{ value: "default", label: "Default" }];
          for (let i = 0; i < files.length; i++) {
            if (!files[i].label) continue;
            this.xttsOptions.push({
              label: files[i].label,
              value: files[i].filepath,
            });
          }
          this.fetchType = this.type == "tts" ? "tts" : "sound";
          this.soundService.getSoundFiles(this.fetchType);
          return;
        }
        this.soundFiles = files;
        if (this.lastCreatedId) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].id == this.lastCreatedId) {
              await this.selectFile(files[i], true);
              break;
            }
          }
          this.lastCreatedId = 0;
        }
      }
    );

    this.generationModelsSubscription =
      this.soundService.generationModelList.subscribe(
        (models: ModelOptions[]) => {
          if (this.type == "tts") return;
          this.modelOptions = models;
          this.useModels = [];
          for (let i = 0; i < models.length; i++)
            this.useModels.push(models[i].value);
        }
      );

    this.ttsModelsSubscription = this.soundService.ttsModelList.subscribe(
      (models: ModelOptions[]) => {
        if (this.type != "tts") return;
        this.modelOptions = models;
        this.useModels = [];
        for (let i = 0; i < models.length; i++)
          this.useModels.push(models[i].value);
      }
    );

    this.generationSubscription =
      this.soundService.generationFinished.subscribe((data: any) => {
        if (!data.id) return;
        this.progressVisible = false;
        this.soundService.getSoundFiles(this.type);
        this.generateEnabled = true;
        this.lastCreatedId = data.id;
      });

    // get resources from server
    this.soundService.getOnlineSoundModels();
    this.soundService.getSoundFiles(this.fetchType);
  }

  @Input() type: string = "tts";
  barkVoiceOptions: any[] = [];
  xttsOptions: any[] = [];
  xttsUseVoice: string = "default";
  soundFiles: any[] = [];
  progressVisible: boolean = false;
  progressValue: number = -1;
  activeSoundFile!: any;
  soundPrompt: string = "";
  modelOptions: any[] = [];
  useModels: string[] = [];
  useVoice: string = "";
  ttsModelsSubscription!: Subscription;
  generationModelsSubscription!: Subscription;
  generationSubscription!: Subscription;
  filesSubscription!: Subscription;
  progressSubscription!: Subscription;
  wavesurfer!: any;
  isPlaying: boolean = false;
  isPaused: boolean = false;
  generateEnabled: boolean = true;
  lastCreatedId: number = 0;
  fetchType: string = "asr";
  guidanceScale: number = 3;
  generateLength: number = 7;
  micOptions: any[] = [];

  deleteSoundFile(soundFile: any) {
    const resourceType = this.type == "tts" ? "text to speech" : "sound";
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),

      message: `Are you sure you want to delete this ${resourceType} file?`,
      icon: `pi pi-trash`,
      accept: () => {
        this.soundService.deleteSoundFile(soundFile.id, this.type);
        if (soundFile.id == this.activeSoundFile?.id) {
          this.activeSoundFile = null;
          this.wavesurfer.empty();
        }
      },
      reject: () => {},
    });
  }

  downloadSoundFile(soundFile: any) {
    const soundUrl = this.soundService.getBaseUrl() + soundFile.filepath;
    const soundId = soundFile.id;
    fetch(soundUrl)
      .then((response) => response.blob())
      .then((blob) => {
        var url = window.URL.createObjectURL(blob);
        var downloadLink = document.createElement("a");
        downloadLink.href = url;
        const link =
          this.type == "tts" ? `text-to-speech-${soundId}` : `sound-${soundId}`;
        downloadLink.download = link;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        window.URL.revokeObjectURL(url);
        downloadLink.remove();
      })
      .catch((error) => console.error("Error:", error));
  }

  generateSound() {
    const type = this.type == "tts" ? "text_to_speech" : "music_generation";
    const options =
      this.type == "tts"
        ? {
            bark_voice: this.useVoice,
            xtts_voice: this.xttsUseVoice,
          }
        : {
            guidance_scale: this.guidanceScale,
            generation_length: this.generateLength,
          };

    this.generateEnabled = false;
    this.progressVisible = true;
    this.soundService.generateSound(
      this.soundPrompt,
      this.useModels,
      type,
      options
    );
  }

  handlePromptKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      if (event.shiftKey || event.altKey) {
        this.soundPrompt += "\n";
        event.preventDefault();
      } else {
        if (this.useModels.length) this.generateSound();
        event.preventDefault();
      }
    }
  }

  getCssVariableValue(variableName: string): string {
    const bodyStyles = window.getComputedStyle(document.body);
    return bodyStyles.getPropertyValue(variableName).trim();
  }

  play() {
    this.wavesurfer.playPause();
    this.isPlaying = true;
    this.isPaused = false;
  }

  pause() {
    this.wavesurfer.playPause();
    this.isPaused = true;
  }

  async selectFile(soundFile: any, autoPlay: boolean = false) {
    const url = this.soundService.getBaseUrl() + soundFile.filepath;
    this.wavesurfer.empty();
    await this.wavesurfer.load(url);
    this.activeSoundFile = soundFile;
    if (autoPlay) {
      this.wavesurfer.playPause();
      this.isPlaying = true;
      this.isPaused = false;
    } else {
      this.isPlaying = false;
    }
  }
}
