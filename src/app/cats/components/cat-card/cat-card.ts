import { Component, computed, input, Signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Cat } from "@models/cat";
import { Carousel, CarouselItem } from "@shared/components/carousel/carousel";
import { CatBadges } from "../cat-badges/cat-badges";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-cat-card",
  templateUrl: "./cat-card.html",
  standalone: true,
  imports: [CommonModule, Carousel, CatBadges, RouterLink],
})
export class CatCard {
  cat = input.required<Cat>();

  get carouselItems(): Signal<CarouselItem[]> {
    return computed(() =>
      this.cat().imageUrls.map((imageUrl, index) => ({
        imageUrl,
        altText: this.cat().name ?? `Cat ${index + 1}`,
      }))
    );
  }
}
