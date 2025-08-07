import { CommonModule } from "@angular/common";
import { Component, effect, input, output } from "@angular/core";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import { Cat } from "@models/cat";
import { MapService } from "@shared/services/map.service";
import {
  Map as LeafletMap,
  MapOptions,
  LayerGroup,
  layerGroup,
  LatLng,
  latLng,
  latLngBounds,
  Popup,
  Control,
} from "leaflet";
import "leaflet-control-geocoder";

@Component({
  selector: "app-cats-map",
  templateUrl: "./cats-map.html",
  standalone: true,
  imports: [CommonModule, LeafletModule],
})
export class CatsMap {
  cats = input.required<Cat[]>();
  userCoords = input<LatLng | null>(null);
  catSelected = output<string>();
  private map!: LeafletMap;
  private geocoder: any | null = null;
  private markersLayer!: LayerGroup;

  get leafletOptions(): MapOptions {
    return MapService.getLeafletMapOptions({});
  }

  constructor() {
    effect(() => {
      const cats = this.cats();
      if (this.map && cats.length > 0) {
        this.onMapReady(this.map);
      }
    });
  }

  async onMapReady(map: LeafletMap): Promise<void> {
    this.map = map;
    this.setGeocoder();
    this.markersLayer = layerGroup().addTo(this.map);
    const cats = this.cats();
    const userCoords = this.userCoords();
    this.updateMapView(cats);

    if (userCoords) {
      this.map.openPopup("Your current location", userCoords, {
        closeButton: false,
      });
    }

    // Filter valid cats for bounds/centering
    const validCats = cats.filter(
      (cat) =>
        cat.xCoordinate != null &&
        cat.yCoordinate != null &&
        !isNaN(cat.xCoordinate) &&
        !isNaN(cat.yCoordinate)
    );

    if (userCoords && validCats.length > 0) {
      const nearestCat = this.findNearestCat(userCoords, validCats);
      const bounds = latLngBounds([
        [userCoords.lat, userCoords.lng],
        [nearestCat.yCoordinate, nearestCat.xCoordinate],
      ]);
      map.fitBounds(bounds, { padding: [20, 40] });
    } else if (userCoords) {
      this.map.setView(userCoords, 15);
    } else if (validCats.length > 0) {
      this.centerMapOnCats(validCats);
    }
  }

  private setGeocoder() {
    if (this.geocoder) {
      return;
    }

    this.geocoder = (Control as any).geocoder({
      defaultMarkGeocode: false,
    });

    this.geocoder.on("markgeocode", (e: any) => {
      const center = e.geocode.center;
      this.map.setView(center, 17);
    });

    this.geocoder.addTo(this.map);
  }

  private updateMapView(cats: Cat[]): void {
    this.markersLayer.clearLayers();
    this.addCatsMarkers(cats);
  }

  private addCatsMarkers(cats: Cat[]): void {
    cats.forEach((cat) => {
      const marker = MapService.getLeafletMarker({
        name: cat.name ?? "Cat",
        latitude: cat.yCoordinate,
        longitude: cat.xCoordinate,
      });
      if (marker) {
        marker.on("click", () => {
          this.catSelected.emit(cat.id);
        });
        this.markersLayer.addLayer(marker);
      }
    });
  }

  private centerMapOnCats(cats: Cat[]): void {
    // Filter valid cats for bounds/centering
    const validCats = cats.filter(
      (cat) =>
        cat.xCoordinate != null &&
        cat.yCoordinate != null &&
        !isNaN(cat.xCoordinate) &&
        !isNaN(cat.yCoordinate)
    );
    if (validCats.length === 0) return;

    const mapOptions = MapService.getLeafletMapOptionsForBounds(validCats);
    this.map.setView(mapOptions.center!, mapOptions.zoom!);
    const bounds = latLngBounds(
      validCats.map((cat) => latLng(cat.yCoordinate, cat.xCoordinate))
    );
    this.map.fitBounds(bounds, { padding: [0, 20] });
  }

  private findNearestCat(userCoords: LatLng, cats: Cat[]): Cat {
    let nearestCat = cats[0];
    let shortestDistance = MapService.calculateDistance(
      userCoords.lat,
      userCoords.lng,
      cats[0].yCoordinate,
      cats[0].xCoordinate
    );

    for (let i = 1; i < cats.length; i++) {
      const distance = MapService.calculateDistance(
        userCoords.lat,
        userCoords.lng,
        cats[i].yCoordinate,
        cats[i].xCoordinate
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCat = cats[i];
      }
    }

    return nearestCat;
  }
}
