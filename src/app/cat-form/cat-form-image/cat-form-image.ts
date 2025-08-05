import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { IconButton } from "@shared/components/icon-button/icon-button";

@Component({
  selector: "app-cat-form-image",
  templateUrl: "./cat-form-image.html",
  standalone: true,
  imports: [CommonModule, IconButton],
})
export class CatFormImage {
  imageUrl = input.required<string>();
  imageName = input.required<string>();
  file = input<File>();
  removeFile = output<File | string>();

  onClick() {
    this.removeFile.emit(this.file() ?? this.imageUrl());
  }
}
