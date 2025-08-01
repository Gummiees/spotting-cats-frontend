import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";

import { routes } from "./app.routes";
import { railwayResponseInterceptor } from "./shared/interceptors/railway-response.interceptor";
import { credentialsInterceptor } from "./shared/interceptors/credentials.interceptor";
import { profanityInterceptor } from "./shared/interceptors/profanity.interceptor";
import { forbiddenInterceptor } from "./shared/interceptors/forbidden.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        credentialsInterceptor,
        profanityInterceptor,
        railwayResponseInterceptor,
        forbiddenInterceptor,
      ])
    ),
  ],
};
