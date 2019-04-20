import firebase from '../middleware/firebase';
import { noop } from '../misc';

export interface INote {
  body: string;
  id: string;
  userId: string;
}

export function createEmptyNote (): INote {
  return {
    body: '',
    id: '',
    userId: '',
  };
}

export function snapshotToRecord (snapshot: firebase.firestore.QueryDocumentSnapshot): INote {
  const data = snapshot.data();
  return {
    body: data.body || '',
    id: snapshot.id,
    userId: data.userId || '',
  };
}

/**
 * @returns {() => void} Unsubscriber.
 */
export function connectUserNotes (
  userId: string,
  onNext: (snapshot: firebase.firestore.QuerySnapshot) => void,
  onError?: ((error: Error) => void) | undefined,
  onCompletion?: (() => void) | undefined,
): () => void {
  if (!userId) {
    return noop;
  }

  const notesRef = firebase.firestore().collection('redux-todo-notes')
    .where('userId', '==', userId);
  const unsubscribeNotes = notesRef.onSnapshot(onNext, onError, onCompletion);
  return unsubscribeNotes;
}
