import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { App } from "./app/app";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { inject } from "@vercel/analytics";

injectSpeedInsights();
inject();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
