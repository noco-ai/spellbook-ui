import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, catchError, from, switchMap, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { SocketService } from "./sockets.service";

@Injectable({
  providedIn: "root",
})
export class GraphqlService {
  private url = `${environment.apiUrl}graphql`;
  private token!: string;
  socketId!: string;

  constructor(private http: HttpClient, private socketService: SocketService) {}

  // function to make a graphql call
  sendQuery(query: string, variables?: any): Observable<any> {
    return from(this.socketService.getSocketId()).pipe(
      switchMap((socketId) => {
        const httpOptions = {
          headers: new HttpHeaders({
            "Content-Type": "application/json",
            Authorization: this.getToken(),
            "Socket-Id": socketId,
          }),
        };

        const body = {
          query: query,
          variables: variables,
        };

        return this.http.post<any>(this.url, body, httpOptions);
      }),
      catchError((error) => {
        console.error("Error getting socket ID:", error);
        return throwError(error);
      })
    );
  }

  private getToken(): string {
    if (!this.token) {
      this.token =
        typeof localStorage.getItem("auth_token") == "string"
          ? `Bearer ${localStorage.getItem("auth_token")}`
          : "";
    }
    return this.token;
  }
}
