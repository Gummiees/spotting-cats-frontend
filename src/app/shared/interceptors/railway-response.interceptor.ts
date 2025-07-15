import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { map } from "rxjs";
import { RailwayResponse } from "../models/railway.response";
import { environment } from "@environments/environment";

// Type guard to check if response is a RailwayResponse
function isRailwayResponse<T>(
  response: unknown
): response is RailwayResponse<T> {
  return (
    response !== null &&
    typeof response === "object" &&
    "data" in response &&
    "success" in response &&
    "message" in response &&
    "timestamp" in response
  );
}

export const railwayResponseInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {
        const body = event.body;

        if (body && isRailwayResponse(body)) {
          return event.clone({ body: body.data });
        }
      }

      return event;
    })
  );
};
