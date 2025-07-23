import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { isDevMode } from '@angular/core';

// Root state interface
export interface State {
  // Add slices of state as needed
}

// Root reducer
export const reducers: ActionReducerMap<State> = {
  // Add reducers as needed
};

// Meta-reducers (middleware that runs before reducers)
export const metaReducers: MetaReducer<State>[] = isDevMode() 
  ? [] // Add debug meta-reducers in development mode if needed
  : []; 