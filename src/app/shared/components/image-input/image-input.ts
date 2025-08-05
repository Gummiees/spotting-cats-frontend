import {
  Component,
  output,
  ViewChild,
  ElementRef,
  input,
  effect,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import * as nsfwjs from "nsfwjs";
import { Subject, switchMap, takeUntil } from "rxjs";

@Component({
  selector: "app-image-input",
  templateUrl: "./image-input.html",
  standalone: true,
  imports: [CommonModule],
})
export class ImageInput implements OnDestroy {
  @ViewChild("fileInput", { static: true })
  fileInput!: ElementRef<HTMLInputElement>;

  triggerClick = input<boolean>(false);
  selected = output<void>();
  processed = output<File[]>();
  error = output<string>();
  acceptImageTypes = ".jpg, .jpeg, .png, .webp";

  private nsfwModel: nsfwjs.NSFWJS | null = null;
  private destroy$ = new Subject<void>();
  private fileSelection$ = new Subject<File[]>();

  constructor() {
    effect(() => {
      if (this.triggerClick()) {
        this.triggerFileInput();
      }
    });

    // Set up the file processing pipeline
    this.fileSelection$
      .pipe(
        switchMap((files) => this.processFiles(files)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          if (result.success && result.files) {
            this.processed.emit(result.files);
          } else if (!result.success && result.error) {
            this.error.emit(result.error);
          }
        },
        error: (error) => {
          console.error("Error processing files:", error);
          this.error.emit("Failed to process files");
        },
      });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    if (!files || files.length === 0) {
      return;
    }

    this.selected.emit();

    const nonImageFiles = files.filter((file) => !this.isImageFile(file));

    if (nonImageFiles.length > 0) {
      this.error.emit(`Only images allowed (${this.acceptImageTypes})`);
      target.value = "";
      return;
    }

    this.fileSelection$.next(files);
    target.value = "";
  }

  private async processFiles(
    files: File[]
  ): Promise<{ success: boolean; files?: File[]; error?: string }> {
    if (!this.nsfwModel) {
      try {
        this.nsfwModel = await nsfwjs.load("InceptionV3");
      } catch (error) {
        console.error("Failed to load NSFW model:", error);
        return { success: true, files };
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const hasNSFW = await this.checkImageForNSFW(file);

        if (hasNSFW) {
          return {
            success: false,
            error: "NSFW content detected. Please select a different image.",
          };
        }
      } catch (error) {
        console.error("Error processing file for NSFW detection:", error);
      }
    }

    return { success: true, files };
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

  private isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
