import { Injectable } from "@angular/core";
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { LoadingService } from "@shared/services/loading.service";
import { CatsService } from "./cats.service";

@Injectable({
  providedIn: "root",
})
export class BreedResolverService implements Resolve<{ breeds: string[] }> {
  constructor(
    private catsService: CatsService,
    private loadingService: LoadingService
  ) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    try {
      this.loadingService.setRouteLoading(true);
      const breeds = await this.catsService.getCatBreeds();
      return { breeds };
    } catch (error) {
      return { breeds: [] };
    } finally {
      this.loadingService.setRouteLoading(false);
    }
  }
}
