import firebase from '../middleware/firebase';
import { noop } from '../misc';
import { IProfile } from './Profiles';

export interface ICurrentUserState {
  id: string;
  loggedIn: boolean;
  name: string;
  ready: boolean;
}
const initialState: ICurrentUserState = {
  id: '',
  loggedIn: false,
  name: '',
  ready: false,
};

interface ISetCurrentUserAction {
  user: firebase.User | null;
  type: 'CURRENT_USER_SET';
}

export function set (user: firebase.User | null): ISetCurrentUserAction {
  return {
    type: 'CURRENT_USER_SET',
    user,
  };
}

function setCurrentUser (user: firebase.User | null): ICurrentUserState {
  if (!user) {
    return {
      ...initialState,
      ready: true,
    };
  }

  return {
    id: user.uid,
    loggedIn: true,
    name: '',
    ready: true,
  };
}

interface ISetCurrentUserProfileAction {
  profile: IProfile;
  type: 'CURRENT_USER_SET_PROFILE';
}

export function setProfile (profile: IProfile): ISetCurrentUserProfileAction {
  return {
    profile,
    type: 'CURRENT_USER_SET_PROFILE',
  };
}

export type CurrentUserAction =
  | ISetCurrentUserAction
  | ISetCurrentUserProfileAction;

export function reduceCurrentUser (
  state = initialState,
  action: CurrentUserAction,
): ICurrentUserState {
  switch (action.type) {
    case 'CURRENT_USER_SET':
      return setCurrentUser(action.user);
    case 'CURRENT_USER_SET_PROFILE':
      return {
        ...state,
        name: action.profile.name,
      };
    default:
      return state;
  }
}

// (method) firebase.auth.Auth.onAuthStateChanged(): firebase.Unsubscribe

export function connectAuth (
  nextOrObserver: (user: firebase.User | null) => void,
  onError: (error: firebase.auth.Error) => any = noop,
  onEach: firebase.Unsubscribe = noop,
): firebase.Unsubscribe {
  const unsubscribeAuth = firebase.auth().onAuthStateChanged(
    (user) => {
      nextOrObserver(user);
      onEach();
    },
    (error) => {
      onError(error);
      onEach();
    },
  );
  return unsubscribeAuth;
}
