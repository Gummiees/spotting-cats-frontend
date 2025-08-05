import { Injectable } from "@angular/core";
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { LoadingService } from "@shared/services/loading.service";
import { CatsService, NotFoundException } from "./cats.service";
import { Cat } from "@models/cat";
import { MapService } from "./map.service";

@Injectable({
  providedIn: "root",
})
export class CatProfileResolverService
  implements Resolve<{ cat: Cat; location: string | null } | null>
{
  constructor(
    private catsService: CatsService,
    private loadingService: LoadingService,
    private mapService: MapService
  ) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const id = route.paramMap.get("id");
    if (!id) {
      throw new Error("Id parameter is required");
    }

    try {
      this.loadingService.setRouteLoading(true);
      const cat = await this.catsService.getCatById(id);
      let location = cat.address || null;
      if (!location) {
        location = await this.mapService.getCatLocation(
          cat.xCoordinate,
          cat.yCoordinate
        );
      }
      return { cat, location };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    } finally {
      this.loadingService.setRouteLoading(false);
    }
  }
}
