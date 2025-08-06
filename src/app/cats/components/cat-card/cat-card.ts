import { Component, computed, input, output, Signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Cat } from "@models/cat";
import { Carousel, CarouselItem } from "@shared/components/carousel/carousel";
import { CatBadges } from "../../../shared/components/cat-badges/cat-badges";
import { Router, RouterLink } from "@angular/router";
import { MinutesAgoPipe } from "@shared/pipes/minutes-ago.pipe";
import { CatAddress } from "@shared/components/cat-address/cat-address";

@Component({
  selector: "app-cat-card",
  templateUrl: "./cat-card.html",
  standalone: true,
  imports: [
    CommonModule,
    Carousel,
    CatBadges,
    RouterLink,
    MinutesAgoPipe,
    CatAddress,
  ],
})
export class CatCard {
  loadingLike = input<boolean>(false);
  cat = input.required<Cat>();
  likeClick = output<void>();

  get carouselItems(): Signal<CarouselItem[]> {
    return computed(() =>
      this.cat().imageUrls.map((imageUrl, index) => ({
        imageUrl,
        altText: this.cat().name ?? `Cat ${index + 1}`,
      }))
    );
  }

  constructor(private router: Router) {}

  async onLikeClick(event: MouseEvent) {
    event.stopPropagation();

    if (this.loadingLike()) {
      return;
    }

    this.likeClick.emit();
  }

  onUserClick(event: MouseEvent) {
    event.stopPropagation();

    this.router.navigate(["/user", this.cat().username]);
  }
}
