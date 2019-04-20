import { combineReducers, createStore, Dispatch, Store } from 'redux';

export interface IAppState {
  foo: string;
}

export type AppAction =
  | { type: 'FOO_BAR' }
  | { type: 'FOO_BOO' };

export type AppDispatch = Dispatch<AppAction>;
export type AppStore = Store<IAppState, AppAction>;

function reduceFoo (state = 'bar', action: AppAction) {
  switch (action.type) {
    case 'FOO_BAR':
      return 'bar';
    case 'FOO_BOO':
      return 'boo';
    default:
      return state;
  }
}

export function createAppStore () {
  const rootReducer = combineReducers<IAppState>({
    foo: reduceFoo,
  });
  const store = createStore<IAppState, AppAction, {}, {}>(
    rootReducer,
  );
  return store;
}
