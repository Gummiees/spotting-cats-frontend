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
  LatLng,
  LatLngBounds,
  latLngBounds,
} from "leaflet";
import { firstValueFrom, map, tap } from "rxjs";
import { environment } from "@environments/environment";
import { Cat } from "@models/cat";

@Injectable({
  providedIn: "root",
})
export class MapService {
  private reverseMapUrl = `${environment.apiUrl}/v1/geocoding/reverse`;
  private static defaultTileLayer = tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      maxZoom: 20,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }
  );
  private static madridLatLng = latLng(40.416775, -3.70379);

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
        layers: [this.defaultTileLayer],
        zoom: 15,
        center: this.madridLatLng,
      };
    }

    return {
      layers: [this.defaultTileLayer],
      zoom: 18,
      center: latLng(latitude, longitude),
    };
  }

  static getLeafletMapOptionsForBounds(cats: Cat[]): MapOptions {
    if (cats.length === 0) {
      return this.getLeafletMapOptions({});
    }

    // Calculate bounds from all cat coordinates
    const validCats = cats.filter(
      (cat) =>
        cat.xCoordinate != null &&
        cat.yCoordinate != null &&
        !isNaN(cat.xCoordinate) &&
        !isNaN(cat.yCoordinate)
    );

    if (validCats.length === 0) {
      return this.getLeafletMapOptions({});
    }

    if (validCats.length === 1) {
      const cat = validCats[0];
      return this.getLeafletMapOptions({
        latitude: cat.yCoordinate,
        longitude: cat.xCoordinate,
      });
    }

    // Calculate center point (average of all coordinates)
    const avgLatitude =
      validCats.reduce((sum, cat) => sum + cat.yCoordinate, 0) /
      validCats.length;
    const avgLongitude =
      validCats.reduce((sum, cat) => sum + cat.xCoordinate, 0) /
      validCats.length;

    // Calculate bounds
    const bounds = latLngBounds(
      validCats.map((cat) => latLng(cat.yCoordinate, cat.xCoordinate))
    );

    // Calculate appropriate zoom level based on bounds
    const zoom = this.calculateZoomFromBounds(bounds);

    return {
      layers: [this.defaultTileLayer],
      zoom: zoom,
      center: latLng(avgLatitude, avgLongitude),
    };
  }

  private static calculateZoomFromBounds(bounds: LatLngBounds): number {
    const latDiff = bounds.getNorth() - bounds.getSouth();
    const lngDiff = bounds.getEast() - bounds.getWest();

    const maxDiff = Math.max(latDiff, lngDiff);
    if (maxDiff > 100) return 2;
    if (maxDiff > 10) return 3;
    if (maxDiff > 1) return 4;
    if (maxDiff > 0.5) return 8;
    if (maxDiff > 0.1) return 10;
    if (maxDiff > 0.05) return 12;
    if (maxDiff > 0.01) return 14;
    if (maxDiff > 0.005) return 16;
    return 18;
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
      icon: this.getLeafletIcon(),
    });
  }

  static getUserMarker(coords: LatLng): Marker {
    return marker(coords, {
      draggable: true,
      title: "Drag me to the cat's location",
      alt: "Drag me to the cat's location",
      icon: this.getLeafletIcon(),
    });
  }

  static getLeafletIcon(): Icon {
    return icon({
      iconUrl: "assets/marker-icon.png",
      iconSize: [30, 42],
      iconAnchor: [15, 42],
    });
  }

  static getGoogleMapsUrl({
    latitude,
    longitude,
  }: {
    latitude: number;
    longitude: number;
  }): string {
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

  static calculateZoomToShowBothPoints(
    coordsA: LatLng,
    coordsB: LatLng
  ): number {
    const distance = this.calculateDistance(
      coordsA.lat,
      coordsA.lng,
      coordsB.lat,
      coordsB.lng
    );

    const zoom = this.calculateLogarithmicZoom(distance);
    return Math.round(zoom);
  }

  private static calculateLogarithmicZoom(distance: number): number {
    // Handle edge cases
    if (distance <= 0) return 18;
    if (distance >= 1000) return 1;

    // Balanced logarithmic formula:
    // 100km -> 2, 50km -> 3, 20km -> 4, 10km -> 7, 5km -> 10, 2km -> 13, 1km -> 15

    if (distance >= 20) {
      // For long distances (≥20km): zoom 2-4
      const zoom = 6.8 - 1.0 * Math.log(distance);
      return Math.max(2, Math.min(4, zoom));
    } else if (distance >= 1) {
      // For medium distances (1-20km): zoom 7-15
      const zoom = 13.8 - 2.2 * Math.log(distance);
      return Math.max(7, Math.min(15, zoom));
    } else {
      // For very short distances (<1km): zoom 16-18
      const zoom = 18.5 - 2.5 * Math.log(distance);
      return Math.max(16, Math.min(18, zoom));
    }
  }

  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    // Haversine formula to calculate distance between two points in kilometers
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
