import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ConfirmationService, MessageService } from "primeng/api";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import { SoundStudioService } from "../../service/sound-studio.service";
import { SocketService } from "src/app/service/sockets.service";
import { FileUpload } from "primeng/fileupload";
import { Subscription } from "rxjs";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import { SoundService } from "src/app/service/sound.service";

@Component({
  selector: "app-asr",
  templateUrl: "./asr.component.html",
  styleUrls: ["./asr.component.scss"],
})
export class AsrComponent implements OnInit, OnDestroy {
  record: any;
  asrPlay: any;
  wavesurfer: any;
  isRecording: boolean = false;
  isPlaying: boolean = false;
  isPaused: boolean = false;
  useModels: string[] = [];
  modelOptions: any[] = [];
  micOptions: any[] = [];
  uploadedFiles: any[] = [];
  showMessage: boolean = true;
  asrText: string = "Use 🎤 or upload file to preform ASR analysis";
  activeSoundFile!: any;
  lastCreatedId: number = 0;
  asrSubscription!: Subscription;
  filesSubscription!: Subscription;
  modelsSubscription!: Subscription;
  soundFiles!: any[];
  progressValue: number = -1;
  progressShowing: boolean = false;
  showUpdateVoiceLabel: boolean = false;
  newVoiceLabel: string = "";
  currentLabelId: number = 0;
  useMic: string = "default;";
  @ViewChild("fileUploader") fileUploader!: FileUpload;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private soundService: SoundStudioService,
    private socketService: SocketService,
    private audioService: SoundService
  ) {}

  getCssVariableValue(variableName: string): string {
    const bodyStyles = window.getComputedStyle(document.body);
    return bodyStyles.getPropertyValue(variableName).trim();
  }

  showUpdateLabelDialog(file: any) {
    this.showUpdateVoiceLabel = true;
    this.currentLabelId = file.id;
    this.newVoiceLabel = file.label;
  }

  updateVoiceLabel() {
    this.showUpdateVoiceLabel = false;
    this.soundService.updateSoundFileLabel(
      this.currentLabelId,
      this.newVoiceLabel
    );
    this.newVoiceLabel = "";
    this.currentLabelId = 0;
  }

  onSelect(event: any) {
    this.showMessage = false;
  }

  onClear() {
    this.showMessage = true;
  }

  play() {
    this.asrPlay.playPause();
    this.isPlaying = true;
    this.isPaused = false;
  }

  pause() {
    this.asrPlay.playPause();
    this.isPaused = true;
  }

  uploadFile(event: any) {
    this.progressShowing = true;
    this.asrText = "";
    this.socketService.uploadFile(
      event.files,
      "upload/workspace",
      0,
      "apps/sound-studio",
      (response: any) => {
        this.fileUploader.clear();
        if (!response || response.error) {
          this.asrText = "💣 an error occurred with uploading file";
          this.progressShowing = false;
          return;
        }
        this.soundService.processAsrUpload(response.file, this.useModels);
      }
    );
  }

  deleteSoundFile(soundFile: any) {
    this.confirmationService.confirm({
      key: "confirmPopup",
      target: event!.target || new EventTarget(),
      message: `Are you sure you want to delete this ASR speech file?`,
      icon: `pi pi-trash`,
      accept: () => {
        this.soundService.deleteSoundFile(soundFile.id, "asr");
        if (soundFile.id == this.activeSoundFile.id) {
          this.activeSoundFile = null;
          this.asrPlay.empty();
          this.asrText = "Use 🎤 or upload file to preform ASR analysis";
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
        downloadLink.download = `asr-${soundId}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        window.URL.revokeObjectURL(url);
        downloadLink.remove();
      })
      .catch((error) => console.error("Error:", error));
  }

  async selectFile(soundFile: any, autoPlay: boolean = false) {
    const url = this.soundService.getBaseUrl() + soundFile.filepath;
    this.asrPlay.empty();
    await this.asrPlay.load(url);
    this.activeSoundFile = soundFile;
    this.asrText = soundFile.text;
    if (autoPlay) {
      this.asrPlay.playPause();
      this.isPlaying = true;
      this.isPaused = false;
    } else {
      this.isPlaying = false;
    }
  }

  ngOnDestroy(): void {
    this.asrSubscription.unsubscribe();
    this.filesSubscription.unsubscribe();
    this.modelsSubscription.unsubscribe();
    this.record.destroy();
    this.wavesurfer.destroy();
    this.asrPlay.destroy();
  }

  async ngOnInit(): Promise<void> {
    this.micOptions =
      (await this.audioService.getAudioDevices("audioinput")) || [];
    this.useMic = this.micOptions.length ? this.micOptions[0].value : "default";

    this.filesSubscription = this.soundService.soundFiles.subscribe(
      (files: any[]) => {
        this.soundFiles = files;
        if (!this.lastCreatedId) return;
        for (let i = 0; i < files.length; i++) {
          if (files[i].id == this.lastCreatedId) {
            this.lastCreatedId = 0;
            this.progressShowing = false;
            this.selectFile(files[i]);
            break;
          }
        }
      }
    );
    this.soundService.getSoundFiles("asr");

    this.modelsSubscription = this.soundService.asrModelList.subscribe(
      (models: ModelOptions[]) => {
        this.modelOptions = models;
        this.useModels = [];
        for (let i = 0; i < models.length; i++)
          this.useModels.push(models[i].value);
      }
    );
    this.soundService.getOnlineSoundModels();

    this.asrSubscription = this.soundService.asrProcessingFinished.subscribe(
      (data: any) => {
        this.lastCreatedId = data.id;
        this.soundService.getSoundFiles("asr");
      }
    );

    this.asrPlay = WaveSurfer.create({
      container: "#asrplay",
      waveColor: this.getCssVariableValue("--primary-color"),
      progressColor: this.getCssVariableValue("--primary-color"),
      height: 132,
    });
    this.asrPlay.empty();

    this.asrPlay.on("finish", () => {
      this.isPlaying = false;
    });

    this.wavesurfer = WaveSurfer.create({
      container: "#record",
      waveColor: this.getCssVariableValue("--primary-color"),
      progressColor: this.getCssVariableValue("--primary-color"),
      height: 132,
    });

    let scrollingWaveform = true;
    this.record = this.wavesurfer.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform,
        renderRecordedAudio: false,
      })
    );
    await this.record.startMic();
    await this.record.stopMic();

    this.record.on("record-end", async (blob: any) => {
      this.progressShowing = true;
      this.asrText = "";
      const recordedUrl = URL.createObjectURL(blob);
      const fileType = blob.type.split(";")[0].split("/")[1] || "webm";
      fetch(recordedUrl)
        .then((response) => response.blob())
        .then((blob) => {
          this.soundService.sendAsrWav(blob, fileType, this.useModels);
        });
      this.isRecording = false;
    });
  }

  downloadFilename(soundFile: any) {
    const split = soundFile.filename.split(".");
    return `asr-${soundFile.id}.${split[split.length - 1]}`;
  }

  async recordFromMic() {
    if (this.isRecording) {
      this.record.stopMic();
      this.record.stopRecording();
      this.isRecording = false;
      return;
    }

    RecordPlugin.getAvailableAudioDevices().then((devices) => {
      devices.forEach((device) => {
        console.log(device);
      });
    });

    await this.record
      .startMic({ deviceId: this.useMic })
      .then(async (stream: MediaStream) => {
        this.isRecording = true;
        await this.record.startRecording();
        let soundDetected = false;

        const MIN_DECIBELS = -55;
        const audioContext = new AudioContext();
        const audioStreamSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = MIN_DECIBELS;
        audioStreamSource.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const domainData = new Uint8Array(bufferLength);
        let lastSoundTime = Date.now();

        const detectSound = async () => {
          analyser.getByteFrequencyData(domainData);

          let currentSoundDetected = false;
          for (let i = 0; i < bufferLength; i++) {
            if (domainData[i] > 0) {
              currentSoundDetected = true;
              lastSoundTime = Date.now();
              if (!soundDetected) {
                //await this.record.startRecording();
                soundDetected = true;
              }
              break;
            }
          }

          if (soundDetected && !currentSoundDetected) {
            if (Date.now() - lastSoundTime >= 1000) {
              soundDetected = false;
              this.record.stopMic();
              this.record.stopRecording();
            }
          }
          window.requestAnimationFrame(detectSound);
        };

        window.requestAnimationFrame(detectSound);
      });
  }
}
