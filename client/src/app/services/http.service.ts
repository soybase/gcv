// Angular
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { filter, map, share } from "rxjs/operators";
// app
import { AppConfig } from "../app.config";
import { GET, POST, Server } from "../models";

declare var Headers: any;

export abstract class HttpService {
  requests: Observable<[any, Observable<any>]>;
  private requestsSubject = new BehaviorSubject<[any, Observable<any>]>(undefined);

  constructor(private http: HttpClient) {
    this.requests = this.requestsSubject.asObservable().pipe(
      filter((request) => request !== undefined)
    );
  }

  // encapsulates HTTP request boilerplate
  protected _makeRequest<T>(
    serverID: string,
    requestType: string,
    body: any,
    options?: any,
  ): Observable<T> {
    options = Object.assign({}, options);
    if (options.makeUrl === undefined) options.makeUrl = ((url: string) => url);
    if (options.postProcessor === undefined) options.postProcessor = ((response) => response);
    const args = {serverID, requestType, body};
    let source: Server;
    const i = AppConfig.SERVERS.map((s) => s.id).indexOf(serverID);
    if (i > -1) {
      source = AppConfig.SERVERS[i];
    } else {
      return throwError("\"" + serverID + "\" is not a valid server ID");
    }
    if (!source.hasOwnProperty(requestType)) {
      return throwError("\"" + serverID + "\" does not support requests of type \"" + requestType + "\"");
    }
    const request = source[requestType];
    const url = options.makeUrl(request.url);
    if (request.type === GET || request.type === POST) {
      let requestObservable;
      if (request.type === GET) {
        const params = new HttpParams({fromObject: body});
        requestObservable = this.http.get<T>(url, {params});
      } else {
        requestObservable = this.http.post<T>(url, body);
      }
      requestObservable = requestObservable
        .pipe(
          map(options.postProcessor),
          share()
        );
      this.requestsSubject.next([args, requestObservable]);
      return requestObservable as Observable<T>;
    }
    return throwError("\"" + serverID + "\" requests of type \"" + requestType + "\" does not support HTTP GET or POST methods");
  }
}
