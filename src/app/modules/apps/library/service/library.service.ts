import { Injectable, EventEmitter } from "@angular/core";
import { SocketService } from "src/app/service/sockets.service";
import { GraphqlService } from "src/app/service/graphql.service";
import { ModelOptions } from "src/app/modules/core/assistant/api/model-options";
import { ProgressUpdate } from "src/app/modules/core/assistant/api/progress-update";
import { LibraryBook } from "../api/library-book";
import { LibraryBookContent } from "../api/library-book-content";
import { LibraryBookAnalysis } from "../api/library-book-analysis";

@Injectable({
  providedIn: "root",
})
export class LibraryService {
  mergeRefinedFinished: EventEmitter<any> = new EventEmitter<any>();
  regenerateArtFinished: EventEmitter<any> = new EventEmitter<any>();
  generateQuizFinished: EventEmitter<any> = new EventEmitter<any>();
  stopJobFinished: EventEmitter<string> = new EventEmitter<string>();
  bookList: EventEmitter<LibraryBook[]> = new EventEmitter<LibraryBook[]>();
  jobsStatus: EventEmitter<any> = new EventEmitter<any>();
  imageModelList: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  reasoningList: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  embeddingList: EventEmitter<ModelOptions[]> = new EventEmitter<
    ModelOptions[]
  >();
  bookContent: EventEmitter<LibraryBookContent[]> = new EventEmitter<
    LibraryBookContent[]
  >();
  bookAnalysis: EventEmitter<LibraryBookAnalysis[]> = new EventEmitter<
    LibraryBookAnalysis[]
  >();
  progressBarUpdate: EventEmitter<ProgressUpdate> =
    new EventEmitter<ProgressUpdate>();
  mapHtml: EventEmitter<string> = new EventEmitter<string>();
  onToastMessage: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private socketService: SocketService,
    private graphqlService: GraphqlService
  ) {
    this.socketService.onToastMessage.subscribe((message) => {
      this.onToastMessage.emit(message);
    });
    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_library_analyze_book",
      (data) => {
        console.log("BOOK being analyzed");
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_library_regenerate_art",
      (data) => {
        this.regenerateArtFinished.emit(data);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_library_generate_quiz",
      (data) => {
        this.generateQuizFinished.emit(data);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_mudd_world_map",
      (data) => {
        this.mapHtml.emit(data);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_library_merge_refined_characters",
      (data) => {
        this.mergeRefinedFinished.emit(data);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_library_stop_job",
      (data: any) => {
        this.stopJobFinished.emit(data.job);
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
        const reasonList =
          !resp.skills || !resp.skills["reasoning_agent"]
            ? []
            : resp.skills["reasoning_agent"];

        const embeddingList =
          !resp.skills || !resp.skills["text_embedding"]
            ? []
            : resp.skills["text_embedding"];
        this.imageModelList.emit(emitList);
        this.reasoningList.emit(reasonList);
        this.embeddingList.emit(embeddingList);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "finish_command",
      "command",
      "app_library_get_job_status",
      (resp) => {
        this.jobsStatus.emit(resp);
      }
    );

    this.socketService.subscribeToEventWithFilter(
      "progress_bar_update",
      "target",
      "app_library",
      (data: ProgressUpdate) => {
        this.progressBarUpdate.emit(data);
      }
    );
  }

  getJobStatus(jobs: string[]) {
    this.socketService.send("command", {
      command: "app_library_get_job_status",
      jobs: jobs,
    });
  }

  async getBooks() {
    const query = `query { getLibraryBook { id, title, num_pages, description, author, cover, created_at } }`;
    this.graphqlService.sendQuery(query, {}).subscribe((data) => {
      const books: LibraryBook[] = data.data.getLibraryBook;
      this.bookList.emit(books);
    });
  }

  async getOnlineSkills() {
    await this.socketService.send("command", {
      command: "get_online_skills",
    });
  }

  async stopJob(jobName: string, bookId: number) {
    await this.socketService.send("command", {
      command: "app_library_stop_job",
      job: jobName,
      bookId: bookId,
    });
  }

  async getBook(bookId: number) {
    const query = `query LibraryBook($id: Int!) { getLibraryBook(id: $id) { id, title, num_pages, description, author, cover, filename, created_at } }`;
    this.graphqlService.sendQuery(query, { id: bookId }).subscribe((data) => {
      const books: LibraryBook[] = data.data.getLibraryBook;
      this.bookList.emit(books);
    });
  }

  async getBookContent(bookId: number) {
    const query = `query LibraryBookContent($book_id: Int!) { getLibraryBookContent(book_id: $book_id) { id, content, file, processed_analysis, created_at } }`;
    this.graphqlService
      .sendQuery(query, { book_id: bookId })
      .subscribe((data) => {
        const content: LibraryBookContent[] = data.data.getLibraryBookContent;
        this.bookContent.emit(content);
      });
  }

  async updateAnalysis(
    analysisId: number,
    updatedText: string,
    callback?: Function
  ) {
    const query = `mutation LibraryBookAnalysisUpdate($id: Int!, $result: String!) { updateLibraryBookAnalysis(id: $id, result: $result) { id } }`;
    this.graphqlService
      .sendQuery(query, { id: analysisId, result: updatedText })
      .subscribe((data) => {
        if (callback) callback(data);
      });
  }

  async getBookAnalysisByBookAndType(
    bookId: number,
    analysisType: string,
    callback?: Function
  ) {
    const query = `query LibraryBookAnalysis($book_id: Int!, $process: String!) { getLibraryBookAnalysis(book_id: $book_id, process: $process) { id, result, content_id, created_at } }`;
    this.graphqlService
      .sendQuery(query, { book_id: bookId, process: analysisType })
      .subscribe((data) => {
        const content: LibraryBookAnalysis[] = data.data.getLibraryBookAnalysis;
        if (callback) return callback(content);
        this.bookAnalysis.emit(content);
      });
  }

  async deleteBook(id: number) {
    const query = `mutation LibraryBookDelete($id: Int!) { deleteLibraryBook(id: $id) { id } }`;
    this.graphqlService.sendQuery(query, { id: id }).subscribe((data) => {
      this.getBooks();
    });
  }

  async analyzeBook(
    id: number,
    content: LibraryBookContent[],
    useModel: string
  ) {
    this.socketService.send("command", {
      command: "app_library_analyze_book",
      id: id,
      content: content,
      use_model: useModel,
    });
  }

  async generateQuiz(id: number, useModel: string) {
    this.socketService.send("command", {
      command: "app_library_generate_quiz",
      id: id,
      use_model: useModel,
    });
  }

  async ingestBook(id: number) {
    this.socketService.send("command", {
      command: "app_library_ingest_book",
      id: id,
    });
  }

  async generateArtwork(
    bookId: number,
    artStyle: string,
    artist: string,
    useModel: string,
    guidanceScale: number,
    steps: number,
    resourceType: string
  ) {
    this.socketService.send("command", {
      command: "app_library_generate_art",
      id: bookId,
      use_model: useModel,
      artist: artist,
      art_style: artStyle,
      guidance_scale: guidanceScale,
      steps: steps,
      resource_type: resourceType,
    });
  }

  async regenerateArtwork(
    bookId: number,
    useModel: string,
    guidanceScale: number,
    steps: number,
    resourceType: string,
    prompt: string,
    resourceId: number
  ) {
    this.socketService.send("command", {
      command: "app_library_regenerate_art",
      id: bookId,
      use_model: useModel,
      guidance_scale: guidanceScale,
      steps: steps,
      resource_type: resourceType,
      prompt: prompt,
      resource_id: resourceId,
    });
  }

  async generateWorldMap(bookId: number) {
    this.socketService.send("command", {
      command: "app_library_generate_world_map",
      id: bookId,
    });
  }

  async mergeRefinedCharacter(id1: number, mergeToId: number) {
    this.socketService.send("command", {
      command: "app_library_merge_refined_characters",
      id: id1,
      to_id: mergeToId,
    });
  }

  async convertCharacterToAlly(id: number) {
    this.socketService.send("command", {
      command: "app_library_convert_to_ally",
      id: id,
    });
  }

  async refineCharacters(
    bookId: number,
    useModel: string,
    embeddingModel: string
  ) {
    this.socketService.send("command", {
      command: "app_library_refine_characters",
      id: bookId,
      use_model: useModel,
      use_embedding_model: embeddingModel,
    });
  }

  async deleteRefinedCharacter(id: number, callback?: Function) {
    const query = `mutation LibraryBookAnalysisDelete($id: Int!) { deleteLibraryBookAnalysis(id: $id) { id } }`;
    this.graphqlService.sendQuery(query, { id: id }).subscribe((data) => {
      if (callback) callback(data);
    });
  }

  getBaseUrl() {
    return this.socketService.getBaseUrl();
  }
}
