import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { firstValueFrom, map } from "rxjs";

import { environment } from "@environments/environment";
import { Cat, CreateCat, UpdateCat } from "@models/cat";

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

  async addCat(cat: CreateCat, images: File[]): Promise<Cat> {
    return firstValueFrom(
      this.http.post<Cat>(
        `${environment.apiUrl}/v1/cats`,
        this.buildFormData(cat, images)
      )
    ).catch((error) => {
      switch (error.status) {
        case 400:
          if (error.error.details.errorCode === "NSFW_CONTENT_DETECTED") {
            throw new NsfwContentDetectedException("NSFW content detected");
          }
          throw new InvalidCatException(error.error.message);
        case 401:
          throw new UnauthorizedException(error.error.message);
        default:
          throw new CatServiceException(error.error.message);
      }
    });
  }

  private buildFormData(cat: CreateCat | UpdateCat, images?: File[]): FormData {
    const formData = new FormData();

    // Add each cat field individually
    formData.append("xCoordinate", cat.xCoordinate.toString());
    formData.append("yCoordinate", cat.yCoordinate.toString());
    if (cat.protectorId !== undefined && cat.protectorId !== null) {
      formData.append("protectorId", cat.protectorId);
    }
    if (cat.colonyId !== undefined && cat.colonyId !== null) {
      formData.append("colonyId", cat.colonyId);
    }
    if (cat.name !== undefined && cat.name !== null) {
      formData.append("name", cat.name);
    }
    if (cat.age !== undefined && cat.age !== null) {
      formData.append("age", cat.age.toString());
    }
    if (cat.breed !== undefined && cat.breed !== null) {
      formData.append("breed", cat.breed);
    }
    if (cat.extraInfo !== undefined && cat.extraInfo !== null) {
      formData.append("extraInfo", cat.extraInfo);
    }
    if (cat.isDomestic !== undefined && cat.isDomestic !== null) {
      formData.append("isDomestic", cat.isDomestic.toString());
    }
    if (cat.isMale !== undefined && cat.isMale !== null) {
      formData.append("isMale", cat.isMale.toString());
    }
    if (cat.isSterilized !== undefined && cat.isSterilized !== null) {
      formData.append("isSterilized", cat.isSterilized.toString());
    }
    if (cat.isFriendly !== undefined && cat.isFriendly !== null) {
      formData.append("isFriendly", cat.isFriendly.toString());
    }

    // Add images if provided
    if (images && images.length > 0) {
      images.forEach((image, _) => {
        formData.append(`images`, image);
      });
    }

    return formData;
  }

  async updateCat(id: string, cat: UpdateCat, images?: File[]): Promise<void> {
    return firstValueFrom(
      this.http.put<void>(
        `${environment.apiUrl}/v1/cats/${id}`,
        this.buildFormData(cat, images)
      )
    ).catch((error) => {
      switch (error.status) {
        case 400:
          if (error.error.details.errorCode === "NSFW_CONTENT_DETECTED") {
            throw new NsfwContentDetectedException("NSFW content detected");
          }
          throw new InvalidCatException(error.error.message);
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

export class NsfwContentDetectedException extends CatServiceException {}

export class InvalidCatException extends CatServiceException {}

export class InvalidIdException extends CatServiceException {}

export class UnauthorizedException extends CatServiceException {}

export class ForbiddenException extends CatServiceException {}

export class NotFoundException extends CatServiceException {}

export class RateLimitException extends CatServiceException {}
