import { HttpInterceptorFn } from "@angular/common/http";

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const modifiedReq = req.clone({
    withCredentials: true,
    headers:
      req.body && !req.headers.has("Content-Type")
        ? req.headers.set("Content-Type", "application/json")
        : req.headers,
  });

  return next(modifiedReq);
};
