import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import {
  Icon,
  icon,
  latLng,
  Marker,
  MapOptions,
  marker,
  tileLayer,
} from "leaflet";
import { firstValueFrom, map, tap } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MapService {
  private reverseMapUrl = "https://nominatim.openstreetmap.org/reverse";

  constructor(private http: HttpClient) {}

  static getLeafletMapOptions({
    latitude,
    longitude,
  }: {
    latitude?: number;
    longitude?: number;
  }): MapOptions {
    if (!latitude || !longitude) {
      return {
        layers: [],
        zoom: 1,
        center: latLng(0, 0),
      };
    }

    return {
      layers: [
        tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }),
      ],
      zoom: 16,
      center: latLng(latitude, longitude),
    };
  }

  static getLeafletMarker({
    name,
    latitude,
    longitude,
  }: {
    name?: string;
    latitude?: number;
    longitude?: number;
  }): Marker | null {
    if (!latitude || !longitude) {
      return null;
    }

    return marker([latitude, longitude], {
      title: name,
      alt: name,
      icon: icon({
        ...Icon.Default.prototype.options,
        iconUrl: "assets/marker-icon.png",
        iconRetinaUrl: "assets/marker-icon-2x.png",
        shadowUrl: "assets/marker-shadow.png",
      }),
    }).bindPopup(name || "Cat", { closeButton: false });
  }

  static getGoogleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  async getCatLocation(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    const params = new HttpParams()
      .set("lat", latitude.toString())
      .set("lon", longitude.toString())
      .set("format", "json");
    return firstValueFrom(
      this.http
        .get<{
          address?: {
            city?: string;
            town?: string;
            village?: string;
            state?: string;
            country?: string;
          };
        } | null>(this.reverseMapUrl, { params })
        .pipe(
          map((res) => {
            if (!res?.address) {
              return null;
            }
            let address = "";
            const city =
              res?.address?.city || res?.address?.town || res?.address?.village;
            if (city) {
              address += city;
            }
            const state = res?.address?.state;
            if (state) {
              address += `, ${state}`;
            }
            const country = res?.address?.country;
            if (country) {
              address += `, ${country}`;
            }
            return address.length > 0 ? address : null;
          })
        )
    );
  }
}
