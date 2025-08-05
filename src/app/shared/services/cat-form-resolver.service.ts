import { Injectable } from "@angular/core";
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { LoadingService } from "@shared/services/loading.service";
import {
  CatsService,
  InvalidIdException,
  NotFoundException,
} from "./cats.service";

@Injectable({
  providedIn: "root",
})
export class CatFormResolverService implements Resolve<{ breeds: string[] }> {
  constructor(
    private catsService: CatsService,
    private loadingService: LoadingService
  ) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    try {
      const id = route.paramMap.get("id");

      this.loadingService.setRouteLoading(true);
      let cat = null;
      if (!!id) {
        cat = await this.catsService.getCatById(id);
      }

      const breeds = await this.catsService.getCatBreeds();
      return { breeds: breeds || [], cat };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InvalidIdException
      ) {
        return { breeds: [], cat: null };
      }
      throw error;
    } finally {
      this.loadingService.setRouteLoading(false);
    }
  }
}
