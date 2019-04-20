import { combineReducers, createStore, Dispatch, Store } from 'redux';
import * as CurrentUser from './CurrentUser';
import * as Errors from './Errors';

export interface IAppState {
  currentUser: CurrentUser.ICurrentUserState;
  errors: Errors.ErrorState;
}

export type AppAction =
| CurrentUser.CurrentUserAction
  | Errors.ErrorAction;

export type AppDispatch = Dispatch<AppAction>;
export type AppStore = Store<IAppState, AppAction>;

export function createAppStore () {
  const rootReducer = combineReducers<IAppState>({
    currentUser: CurrentUser.reduceCurrentUser,
    errors: Errors.reduceErrors,
  });
  const store = createStore<IAppState, AppAction, {}, {}>(
    rootReducer,
  );
  return store;
}
