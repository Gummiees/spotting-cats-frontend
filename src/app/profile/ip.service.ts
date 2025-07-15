import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { firstValueFrom, map } from "rxjs";

@Injectable()
export class IpService {
  constructor(private http: HttpClient) {}

  async getCountryCodeByIp(ip: string): Promise<string> {
    return firstValueFrom(
      this.http
        .get<{ country_code: string }>(`${environment.ipApiUrl}/${ip}/json`)
        .pipe(map((response) => response.country_code))
    ).catch((error) => {
      throw new IpServiceException(error.error.message);
    });
  }
}

export class IpServiceException extends Error {
  constructor(message: string) {
    super(message);
  }
}
