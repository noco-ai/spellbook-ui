import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { AssistantService } from "../../service/assistant.service";
import { SocketService } from "src/app/service/sockets.service";

@Component({
  selector: "chat-uploaded-files",
  templateUrl: "./uploaded-files.component.html",
  styleUrls: ["./uploaded-files.component.scss"],
})
export class UploadedFilesComponent implements OnInit {
  baseUrl: string = "";
  @Input() fileList: string[] = [];
  @Output() playSound = new EventEmitter<string>();
  @Output() stopSound = new EventEmitter<void>();
  ngOnInit(): void {}
  constructor(
    private chatService: AssistantService,
    socketService: SocketService
  ) {
    this.baseUrl = socketService.getBaseUrl();
    console.log(this.fileList);
  }

  getFileType(fileName: string): "image" | "audio" | "other" {
    const ext = fileName.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "image";
      case "mp3":
      case "wav":
      case "ogg":
        return "audio";
      default:
        return "other";
    }
  }

  getFilenameFromPath(path: string): string {
    const segments = path.split(/[/\\]/);
    return segments.pop() || "";
  }

  play(fileName: string) {
    this.playSound.emit(fileName);
  }

  stop() {
    this.stopSound.emit();
  }
}
