import { Component, OnInit, signal } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { firstValueFrom } from "rxjs";

import { Cat } from "@models/cat";
import { CatsService, NewCat } from "../../shared/services/cats.service";

@Component({
  selector: "app-cats",
  templateUrl: "./cats.component.html",
  styleUrls: ["./cats.component.scss"],
  providers: [CatsService],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class CatsComponent implements OnInit {
  cats: Cat[] = [];
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showForm = false;
  editingCat: Cat | null = null;
  catForm: FormGroup;
  showDeleteDialog = false;
  catToDelete: Cat | null = null;

  constructor(private catsService: CatsService, private fb: FormBuilder) {
    this.catForm = this.fb.group({
      name: ["", Validators.required],
      age: [null, [Validators.min(0)]],
      breed: [""],
    });
  }

  async ngOnInit() {
    await this.loadCats();
  }

  onAdd() {
    this.editingCat = null;
    this.catForm.reset();
    this.showForm = true;
  }

  onEdit(cat: Cat) {
    this.editingCat = cat;
    this.catForm.patchValue({
      name: cat.name,
      age: cat.age ?? null,
      breed: cat.breed ?? "",
    });
    this.showForm = true;
  }

  onCancel() {
    this.showForm = false;
    this.editingCat = null;
  }

  async onSubmit() {
    if (this.catForm.invalid) return;
    const formValue = this.catForm.value;
    if (this.editingCat) {
      await this.updateCat(this.editingCat.id, {
        ...this.editingCat,
        ...formValue,
      });
    } else {
      await this.addCat({
        id: "",
        ...formValue,
      });
    }
    this.showForm = false;
    this.editingCat = null;
  }

  onDelete(cat: Cat) {
    this.catToDelete = cat;
    this.showDeleteDialog = true;
  }

  onCancelDelete() {
    this.showDeleteDialog = false;
    this.catToDelete = null;
  }

  async onConfirmDelete() {
    if (this.catToDelete) {
      await this.deleteCat(this.catToDelete.id);
    }
    this.showDeleteDialog = false;
    this.catToDelete = null;
  }

  onRefresh() {
    this.loadCats();
  }

  private async loadCats() {
    await this.executeWithErrorHandling(async () => {
      this.cats = await this.getApiCats();
    });
  }

  public async addCat(newCat: NewCat) {
    await this.executeWithErrorHandling(async () => {
      await this.addApiCat(newCat);
      await this.loadCats();
      this.showSuccess("Cat added successfully!");
    });
  }

  public async updateCat(id: string, cat: Cat) {
    await this.executeWithErrorHandling(async () => {
      await this.updateApiCat(id, cat);
      await this.loadCats();
      this.showSuccess("Cat updated successfully!");
    });
  }

  public async deleteCat(id: string) {
    await this.executeWithErrorHandling(async () => {
      await this.deleteApiCat(id);
      await this.loadCats();
      this.showSuccess("Cat deleted successfully!");
    });
  }

  private async getApiCats(): Promise<Cat[]> {
    try {
      const result = await this.catsService.getCats();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      return [];
    }
  }

  private async addApiCat(newCat: NewCat) {
    return this.catsService.addCat(newCat);
  }

  private async updateApiCat(id: string, cat: Cat) {
    return this.catsService.updateCat(id, cat);
  }

  private async deleteApiCat(id: string) {
    return this.catsService.deleteCat(id);
  }

  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>
  ): Promise<T | undefined> {
    try {
      this.loading.set(true);
      return await operation();
    } catch (error) {
      this.error.set(this.parseError(error));
      return undefined;
    } finally {
      this.loading.set(false);
    }
  }

  private parseError(error: unknown): string {
    return error instanceof Error ? error.message : "An unknown error occurred";
  }

  private showSuccess(message: string) {
    this.success.set(message);
    setTimeout(() => {
      this.success.set(null);
    }, 3000);
  }
}
