import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import * as leoProfanity from "leo-profanity";
import { SnackbarService } from "../services/snackbar.service";
import { inject } from "@angular/core";

export const profanityInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbarService = inject(SnackbarService);

  // Check request body for POST/PUT/PATCH
  if (req.body && ["POST", "PUT", "PATCH"].includes(req.method)) {
    const profanityFound = checkProfanityInObject(req.body);
    if (profanityFound) {
      snackbarService.show("You cannot use profanity", "error");
      throw new HttpErrorResponse({
        error: "Profanity detected in request data",
        status: 400,
      });
    }
  }

  // Check URL parameters for GET requests
  if (req.method === "GET" && req.params.keys().length > 0) {
    const paramsObject = req.params.keys().reduce((acc, key) => {
      acc[key] = req.params.get(key);
      return acc;
    }, {} as any);

    const profanityFound = checkProfanityInObject(paramsObject);
    if (profanityFound) {
      snackbarService.show("You cannot use profanity", "error");
      throw new HttpErrorResponse({
        error: "Profanity detected in request parameters",
        status: 400,
      });
    }
  }

  return next(req);
};

function checkProfanityInObject(obj: any): boolean {
  if (obj === null || obj === undefined) {
    return false;
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => checkProfanityInObject(item));
  }

  if (typeof obj === "object") {
    return Object.values(obj).some((value) => checkProfanityInObject(value));
  }

  if (typeof obj === "string") {
    console.log("Checking profanity in string:", obj);
    return leoProfanity.check(obj);
  }

  return false;
}
