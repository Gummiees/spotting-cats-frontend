import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { environment } from "@environments/environment";
import { Note } from "../../../models/note";

@Injectable()
export class NotesService {
  constructor(private http: HttpClient) {}

  async getNotes(forUser: string): Promise<Note[]> {
    return firstValueFrom(
      this.http.get<Note[]>(`${environment.apiUrl}/v1/notes/${forUser}`)
    );
  }

  async addNote(forUser: string, note: Note): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(
        `${environment.apiUrl}/v1/notes/user/${forUser}`,
        note
      )
    );
  }

  async updateNote(id: string, forUser: string, note: Note): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(
        `${environment.apiUrl}/v1/notes/user/${forUser}/${id}`,
        note
      )
    );
  }

  async deleteNote(id: string, forUser: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `${environment.apiUrl}/v1/notes/user/${forUser}/${id}`
      )
    );
  }
}

export class CatsFilter {
  protectorId?: string;
  colonyId?: string;
  age?: number;
  isDomestic?: boolean;
  isMale?: boolean;
  isSterilized?: boolean;
  isFriendly?: boolean;
  isUserOwner?: boolean;
  limit?: number;
  page?: number;
}
