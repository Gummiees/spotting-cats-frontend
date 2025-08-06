import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import * as leoProfanity from "leo-profanity";
import { SnackbarService } from "../services/snackbar.service";
import { inject } from "@angular/core";
import { environment } from "@environments/environment";

export const profanityInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const snackbarService = inject(SnackbarService);

  // Check request body for POST/PUT/PATCH
  if (req.body && ["POST", "PUT", "PATCH"].includes(req.method)) {
    let profanityFound = false;

    if (req.body instanceof FormData) {
      profanityFound = checkProfanityInFormData(req.body);
    } else {
      profanityFound = checkProfanityInObject(req.body);
    }

    if (profanityFound) {
      snackbarService.show("You cannot use profanity", "error");
      throw new HttpErrorResponse({
        error: "Profanity detected in request data",
        status: 422,
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
        status: 422,
      });
    }
  }

  return next(req);
};

function checkProfanityInFormData(formData: FormData): boolean {
  for (const [key, value] of formData.entries()) {
    // Check the key itself for profanity
    if (typeof key === "string" && leoProfanity.check(key)) {
      return true;
    }

    // Check the value if it's a string (File objects are not checked for profanity)
    if (typeof value === "string" && leoProfanity.check(value)) {
      return true;
    }
  }
  return false;
}

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
    return leoProfanity.check(obj);
  }

  return false;
}
