import {
  ApplicationConfig,
  importProvidersFrom,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import localeFr from '@angular/common/locales/fr';
import { routes } from './app.routes';
import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AuthInterceptor } from '../../auth.interceptor';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeFr, 'fr');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'fr' },
  ],
};
