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
} from "leaflet";

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
    this.markersLayer = layerGroup().addTo(this.map);
    const cats = this.cats();
    const userCoords = this.userCoords();
    this.updateMapView(cats);

    if (userCoords) {
      this.map.openPopup("You are here", userCoords);
    }

    if (userCoords && cats.length > 0) {
      const nearestCat = this.findNearestCat(userCoords, cats);
      const bounds = latLngBounds([
        [userCoords.lat, userCoords.lng],
        [nearestCat.yCoordinate, nearestCat.xCoordinate],
      ]);

      map.fitBounds(bounds, { padding: [20, 40] });
    } else if (userCoords) {
      this.map.setView(userCoords, 15);
    } else if (cats.length > 0) {
      this.centerMapOnCats(cats);
    }
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
    if (cats.length === 0) return;

    const mapOptions = MapService.getLeafletMapOptionsForBounds(cats);
    this.map.setView(mapOptions.center!, mapOptions.zoom!);
    const bounds = latLngBounds(
      cats.map((cat) => latLng(cat.yCoordinate, cat.xCoordinate))
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
