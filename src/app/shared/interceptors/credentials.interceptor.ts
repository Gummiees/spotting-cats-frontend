import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const modifiedReq = req.clone({
    withCredentials: true,
    headers:
      req.body && !req.headers.has("Content-Type")
        ? req.headers.set("Content-Type", "application/json")
        : req.headers,
  });

  return next(modifiedReq);
};
