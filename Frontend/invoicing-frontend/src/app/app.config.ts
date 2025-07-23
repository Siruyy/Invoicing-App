import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DatePipe, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// NgRx
import { provideStore, MetaReducer, ActionReducerMap } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

// Root state interface
export interface AppState {
  router: any;
  // Add other state slices here
}

// Root reducers
const reducers: ActionReducerMap<AppState> = {
  router: routerReducer
  // Add other reducers here
};

// Meta-reducers
const metaReducers: MetaReducer<AppState>[] = [];

// Effects
const effects: any[] = [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    
    // Pipe providers
    DatePipe,
    CurrencyPipe, 
    DecimalPipe,
    PercentPipe,
    
    // NgRx
    provideStore(reducers, { 
      metaReducers 
    }),
    provideEffects(effects),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),
  ]
};
