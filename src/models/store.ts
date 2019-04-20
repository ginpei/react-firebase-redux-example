import { combineReducers, createStore, Dispatch, Store } from 'redux';
import * as Errors from './Errors';

export interface IAppState {
  errors: Errors.ErrorState;
}

export type AppAction =
  | Errors.ErrorAction;

export type AppDispatch = Dispatch<AppAction>;
export type AppStore = Store<IAppState, AppAction>;

export function createAppStore () {
  const rootReducer = combineReducers<IAppState>({
    errors: Errors.reduceErrors,
  });
  const store = createStore<IAppState, AppAction, {}, {}>(
    rootReducer,
  );
  return store;
}
