import { Component, input, signal } from "@angular/core";
import { CommonModule } from "@angular/common";

export interface CarouselItem {
  imageUrl: string;
  altText: string;
}

@Component({
  selector: "app-carousel",
  templateUrl: "./carousel.html",
  standalone: true,
  imports: [CommonModule],
})
export class Carousel {
  items = input.required<CarouselItem[]>();
  currentIndex = signal(0);

  get currentItem() {
    return this.items()[this.currentIndex()];
  }

  next(event: Event) {
    event.stopPropagation();
    const len = this.items().length;
    this.currentIndex.set((this.currentIndex() + 1) % len);
  }

  previous(event: Event) {
    event.stopPropagation();
    const len = this.items().length;
    this.currentIndex.set((this.currentIndex() - 1 + len) % len);
  }
}
