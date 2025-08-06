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
import { Cat } from "@models/cat";

@Injectable({
  providedIn: "root",
})
export class CatProfileResolverService implements Resolve<Cat | null> {
  constructor(
    private catsService: CatsService,
    private loadingService: LoadingService
  ) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const id = route.paramMap.get("id");

    if (!id) {
      throw new Error("Id parameter is required");
    }

    try {
      this.loadingService.setRouteLoading(true);
      const cat = await this.catsService.getCatById(id);

      return cat;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InvalidIdException
      ) {
        return null;
      }
      throw error;
    } finally {
      this.loadingService.setRouteLoading(false);
    }
  }
}
