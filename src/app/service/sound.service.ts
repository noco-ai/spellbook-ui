import { Injectable, EventEmitter } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { io, Socket } from "socket.io-client";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";
import { SocketService } from "./sockets.service";

interface FilterDetail {
  filter: any;
  emitter: EventEmitter<any>;
}

@Injectable({
  providedIn: "root",
})
export class SoundService {
  asrProcessingFinished: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private socketService: SocketService
  ) {
    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "process_asr_data",
      (data) => {
        this.asrProcessingFinished.emit(data);
      }
    );
  }

  getCssVariableValue(variableName: string): string {
    const bodyStyles = window.getComputedStyle(document.body);
    return bodyStyles.getPropertyValue(variableName).trim();
  }

  async createWavesurferRecordingInstance(
    divId: string,
    height: number = 132
  ): Promise<any> {
    const wavesurfer = WaveSurfer.create({
      container: divId,
      waveColor: this.getCssVariableValue("--primary-color"),
      progressColor: this.getCssVariableValue("--primary-color"),
      height: height,
    });

    let scrollingWaveform = true;
    const record = wavesurfer.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform,
        renderRecordedAudio: false,
      })
    );

    try {
      await record.startMic();
      await record.stopMic();
    }
    catch (ex) {}
    return { wavesurfer: wavesurfer, record: record };
  }

  async getAudioDevices(
    filterType?: string
  ): Promise<{ label: string; value: string }[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return Promise.reject(Error("MediaDevices API not supported"));
    }

    return navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        return devices
          .filter(
            (device) =>
              filterType == device.kind ||
              (!filterType &&
                (device.kind === "audioinput" || device.kind === "audiooutput"))
          )
          .map((device) => ({ label: device.label, value: device.deviceId }));
      })
      .catch((err) => {
        throw err;
      });
  }

  async startRecording(record: any, deviceId: string = "default") {
    await record
      .startMic({ deviceId: deviceId })
      .then(async (stream: MediaStream) => {
        await record.startRecording();
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
              record.stopMic();
              record.stopRecording();
            }
          }
          window.requestAnimationFrame(detectSound);
        };

        window.requestAnimationFrame(detectSound);
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

  async sendAsrToServer(blob: any, fileType: string) {
    const encodedBlob = await this.blobToBase64(blob);
    this.socketService.send("command", {
      command: "process_asr_data",
      wav: encodedBlob,
      file_type: fileType,
    });
  }
}
