import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient,withInterceptors  } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideAnimations } from '@angular/platform-browser/animations';


registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(
    withInterceptors([authInterceptor]),),
     providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideAnimations()
  ],   
};
