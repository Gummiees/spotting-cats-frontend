import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { Cat } from "../models/cat";
import { map, Observable, of } from "rxjs";
import { ApiCat } from "./api.cat";

@Injectable()
export class CatsService {
  constructor(private http: HttpClient) {}

  getCats(): Observable<Cat[]> {
    return this.http
      .get<ApiCat[]>(`${environment.apiUrl}/cats`)
      .pipe(map((cats) => cats.map((cat) => this.mapCat(cat))));
  }

  getCatById(id: string): Observable<Cat> {
    return this.http
      .get<ApiCat>(`${environment.apiUrl}/cats/${id}`)
      .pipe(map((cat) => this.mapCat(cat)));
  }

  addCat(cat: Cat): Observable<Cat> {
    return this.http
      .post<ApiCat>(`${environment.apiUrl}/cats`, cat)
      .pipe(map((cat) => this.mapCat(cat)));
  }

  updateCat(id: string, cat: Cat): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/cats/${id}`, cat);
  }

  deleteCat(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/cats/${id}`);
  }

  private mapCat(cat: ApiCat): Cat {
    return {
      id: cat._id,
      name: cat.name,
      age: cat.age,
      breed: cat.breed,
    };
  }
}
