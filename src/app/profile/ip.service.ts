import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { firstValueFrom, map } from "rxjs";

@Injectable()
export class IpService {
  private ipApiUrl = "https://ipapi.co";

  constructor(private http: HttpClient) {}

  async getCountryCodeByIp(ip: string): Promise<string> {
    return firstValueFrom(
      this.http
        .get<{ country_code: string }>(`${this.ipApiUrl}/${ip}/json`)
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
