export type AnyError = Error | firebase.auth.Error;

export interface IErrorLog {
  error: AnyError;
  occurredAt: number;
}

export type ErrorState = IErrorLog[];

interface IAddErrorAction {
  error: AnyError;
  occurredAt?: number;
  type: 'ERROR_ADD';
}

export function add (error: AnyError): IAddErrorAction {
  console.error(error);
  return {
    error,
    occurredAt: Date.now(),
    type: 'ERROR_ADD',
  };
}

interface IClearErrorAction {
  type: 'ERROR_CLEAR';
}

export function clear (): IClearErrorAction {
  return {
    type: 'ERROR_CLEAR',
  };
}

export type ErrorAction =
  | IAddErrorAction
  | IClearErrorAction;

export function reduceErrors (
  state: ErrorState = [],
  action: ErrorAction,
): ErrorState {
  switch (action.type) {
    case 'ERROR_ADD': {
      const errors = [...state];
      errors.push({
        error: action.error,
        occurredAt: action.occurredAt || Date.now(),
      });
      return errors;
    }

    case 'ERROR_CLEAR': {
      return [];
    }

    default:
      return state;
  }
}
