import { Component, OnInit, signal } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { Cat } from "@models/cat";
import { CatsService } from "../shared/services/cats.service";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";
import { SnackbarService } from "@shared/services/snackbar.service";
import { AuthStateService } from "@shared/services/auth-state.service";
import { CatCard } from "./components/cat-card/cat-card";

@Component({
  selector: "app-cats",
  templateUrl: "./cats.html",
  providers: [CatsService],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimaryButton, CatCard],
})
export class CatsComponent implements OnInit {
  cats: Cat[] = [];
  loading = signal<boolean>(false);
  showForm = false;
  editingCat: Cat | null = null;
  catToDelete: Cat | null = null;
  showDeleteDialog = false;

  constructor(
    private catsService: CatsService,
    private snackbarService: SnackbarService,
    private authStateService: AuthStateService
  ) {}

  async ngOnInit() {
    await this.loadCats();
  }

  private get user() {
    return this.authStateService.user();
  }

  onAddDefaultCat() {
    if (!this.user) {
      this.snackbarService.show("Please login to add a cat", "error");
      return;
    }

    this.addCat({
      id: "",
      totalLikes: 3,
      imageUrls: [
        "https://cdn2.thecatapi.com/images/h5.jpg",
        "https://cdn2.thecatapi.com/images/a6q.jpg",
        "https://cdn2.thecatapi.com/images/bmh.jpg",
      ],
      xCoordinate: 40.925908,
      yCoordinate: -0.06771,
      isUserOwner: true,
      name: "Default Cat",
      age: 4,
      breed: "Tuxedo",
      extraInfo: "Lovely cat",
      isDomestic: true,
      isMale: true,
      isSterilized: true,
      isFriendly: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      confirmedOwnerAt: new Date(),
    });
  }

  onCancel() {
    this.showForm = false;
    this.editingCat = null;
    this.catToDelete = null;
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
    this.cats = await this.getApiCats();
  }

  public async addCat(newCat: Cat) {
    await this.addApiCat(newCat);
    await this.loadCats();
  }

  public async updateCat(id: string, cat: Cat) {
    await this.updateApiCat(id, cat);
    await this.loadCats();
  }

  public async deleteCat(id: string) {
    await this.deleteApiCat(id);
    await this.loadCats();
  }

  private async getApiCats(): Promise<Cat[]> {
    try {
      const result = await this.catsService.getCats();
      return Array.isArray(result) ? result : [];
    } catch (error) {
      return [];
    }
  }

  private async addApiCat(newCat: Cat) {
    return this.catsService.addCat(newCat);
  }

  private async updateApiCat(id: string, cat: Cat) {
    return this.catsService.updateCat(id, cat);
  }

  private async deleteApiCat(id: string) {
    return this.catsService.deleteCat(id);
  }
}
