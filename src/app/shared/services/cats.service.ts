import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { environment } from "@environments/environment";
import { Cat } from "@models/cat";

export const MAX_CATS_PER_PAGE = 12;

@Injectable({
  providedIn: "root",
})
export class CatsService {
  constructor(private http: HttpClient) {}

  async getMyCats(): Promise<Cat[]> {
    return firstValueFrom(
      this.http.get<Cat[]>(`${environment.apiUrl}/v1/cats/my`)
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        default:
          throw new CatServiceException(error.error.message);
      }
    });
  }

  async getCats(filter?: CatsFilter): Promise<Cat[]> {
    const params = this.buildFilterParams(filter);

    return firstValueFrom(
      this.http.get<Cat[]>(`${environment.apiUrl}/v1/cats`, {
        params,
      })
    );
  }

  private buildFilterParams(filter?: CatsFilter): HttpParams {
    let params = new HttpParams();

    const filterParams = {
      protectorId: filter?.protectorId,
      colonyId: filter?.colonyId,
      age: filter?.age,
      isDomestic: filter?.isDomestic,
      isMale: filter?.isMale,
      isSterilized: filter?.isSterilized,
      isFriendly: filter?.isFriendly,
      isUserOwner: filter?.isUserOwner,
      page: filter?.page,
    };

    Object.entries(filterParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    params = params.set(
      "limit",
      (filter?.limit ?? MAX_CATS_PER_PAGE).toString()
    );
    params = params.set("orderBy", filter?.orderBy?.field ?? "createdAt");
    params = params.set("orderDirection", filter?.orderBy?.direction ?? "DESC");

    return params;
  }

  async getCatById(id: string): Promise<Cat> {
    return firstValueFrom(
      this.http.get<Cat>(`${environment.apiUrl}/v1/cats/${id}`)
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidIdException(error.error.message);
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new CatServiceException(error.error.message);
      }
    });
  }

  async addCat(cat: Cat): Promise<Cat> {
    return firstValueFrom(
      this.http.post<Cat>(`${environment.apiUrl}/v1/cats`, cat)
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidCatException(error.error.message);
        case 401:
          throw new UnauthorizedException(error.error.message);
        default:
          throw new CatServiceException(error.error.message);
      }
    });
  }

  async updateCat(id: string, cat: Cat): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/v1/cats/${id}`, cat)
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          throw new ForbiddenException(error.error.message);
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new CatServiceException(error.error.message);
      }
    });
  }

  async deleteCat(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${environment.apiUrl}/v1/cats/${id}`)
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          throw new ForbiddenException(error.error.message);
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new CatServiceException(error.error.message);
      }
    });
  }
}

export type OrderDirection = "ASC" | "DESC";

export interface CatOrderBy {
  field: "totalLikes" | "age" | "createdAt";
  direction: OrderDirection;
}

export interface CatsFilter {
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
  orderBy?: CatOrderBy;
}

export class CatServiceException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCatException extends CatServiceException {}

export class InvalidIdException extends CatServiceException {}

export class UnauthorizedException extends CatServiceException {}

export class ForbiddenException extends CatServiceException {}

export class NotFoundException extends CatServiceException {}

export class RateLimitException extends CatServiceException {}
