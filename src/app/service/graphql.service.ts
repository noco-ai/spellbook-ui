import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: "root",
})
export class GraphqlService {
  private url = `${environment.apiUrl}graphql`;

  constructor(private http: HttpClient) {}

  // function to make a graphql call
  sendQuery(query: string, variables?: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
      }),
    };

    const body = {
      query: query,
      variables: variables,
    };

    return this.http.post<any>(this.url, body, httpOptions);
  }
}
