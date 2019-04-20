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
    return initialState;
  }

  return {
    id: user.uid,
    loggedIn: true,
    name: user.displayName || '',
    ready: true,
  };
}

export type CurrentUserAction =
  | ISetCurrentUserAction;

export function reduceCurrentUser (
  state = initialState,
  action: CurrentUserAction,
): ICurrentUserState {
  switch (action.type) {
    case 'CURRENT_USER_SET':
      return setCurrentUser(action.user);
    default:
      return state;
  }
}
