import {
  Component,
  output,
  ViewChild,
  ElementRef,
  input,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import * as nsfwjs from "nsfwjs";

@Component({
  selector: "app-image-input",
  templateUrl: "./image-input.html",
  standalone: true,
  imports: [CommonModule],
})
export class ImageInput {
  @ViewChild("fileInput", { static: true })
  fileInput!: ElementRef<HTMLInputElement>;

  triggerClick = input<boolean>(false);
  selected = output<void>();
  processed = output<File[]>();
  error = output<string>();

  private nsfwModel: nsfwjs.NSFWJS | null = null;

  constructor() {
    effect(() => {
      if (this.triggerClick()) {
        this.triggerFileInput();
      }
    });
  }

  async onFileSelected(event: Event) {
    this.selected.emit();
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    if (!files || files.length === 0) {
      return;
    }

    if (!this.nsfwModel) {
      try {
        this.nsfwModel = await nsfwjs.load("InceptionV3");
      } catch (error) {
        console.error("Failed to load NSFW model:", error);
        this.processed.emit(files);
        return;
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const hasNSFW = await this.checkImageForNSFW(file);

        if (hasNSFW) {
          this.error.emit(
            "NSFW content detected. Please select a different image."
          );
          target.value = "";
          return;
        }
      } catch (error) {
        console.error("Error processing file for NSFW detection:", error);
      }
    }

    this.processed.emit(files);
  }

  private async checkImageForNSFW(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = async () => {
        try {
          const predictions = await this.nsfwModel!.classify(img);

          const predictionObj: { [key: string]: number } = {};
          predictions.forEach((prediction: any) => {
            predictionObj[prediction.className] = prediction.probability;
          });
          const nsfwScore =
            (predictionObj["Porn"] || 0) +
            (predictionObj["Sexy"] || 0) +
            (predictionObj["Hentai"] || 0);
          const isNSFW = nsfwScore > 0.5;

          resolve(isNSFW);
        } catch (error) {
          console.error("Error classifying image:", error);
          resolve(false);
        }
      };

      img.onerror = () => {
        console.error("Failed to load image for NSFW detection");
        resolve(false);
      };

      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    });
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }
}
