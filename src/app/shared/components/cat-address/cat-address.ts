import { Component, computed, input, Signal } from "@angular/core";
import { Cat } from "@models/cat";
import { CommonModule } from "@angular/common";
import { MapService } from "@shared/services/map.service";

@Component({
  selector: "app-cat-address",
  templateUrl: "./cat-address.html",
  standalone: true,
  imports: [CommonModule],
})
export class CatAddress {
  cat = input.required<Cat>();

  get googleMapsUrl(): Signal<string | null> {
    return computed(() => {
      const cat = this.cat();
      if (!cat || !cat.xCoordinate || !cat.yCoordinate) {
        return null;
      }
      return MapService.getGoogleMapsUrl({
        latitude: cat.yCoordinate,
        longitude: cat.xCoordinate,
      });
    });
  }
}
