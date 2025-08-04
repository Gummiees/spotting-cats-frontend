import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { catchError, throwError } from "rxjs";
import { inject } from "@angular/core";
import { environment } from "@environments/environment";
import { AuthStateService } from "../services/auth-state.service";

export const forbiddenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403 || error.status === 401) {
        const authStateService = inject(AuthStateService);

        authStateService.setUnauthenticated();
      }

      return throwError(() => error);
    })
  );
};
