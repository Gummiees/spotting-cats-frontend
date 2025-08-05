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
import { environment } from "@environments/environment";

@Injectable({
  providedIn: "root",
})
export class MapService {
  private reverseMapUrl = `${environment.apiUrl}/v1/geocoding/reverse`;

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
      .set("lon", longitude.toString());

    try {
      return firstValueFrom(
        this.http
          .get<{ address: string | null }>(this.reverseMapUrl, { params })
          .pipe(map((res) => res.address))
      );
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }
}
