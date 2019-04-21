import firebase from '../middleware/firebase';
import { noop } from '../misc';

const collectionName = 'redux-todo-notes';

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
  onError: (error: Error) => void = noop,
  onEach: () => void = noop,
): () => void {
  if (!userId) {
    onEach();
    return noop;
  }

  const notesRef = firebase.firestore().collection(collectionName)
    .where('userId', '==', userId);
  const unsubscribeNotes = notesRef.onSnapshot(
    (snapshot) => {
      onNext(snapshot);
      onEach();
    },
    (error) => {
      onError(error);
      onEach();
    },
  );
  return unsubscribeNotes;
}

export function save (
  note: INote,
): Promise<firebase.firestore.DocumentData | void> {
  const notesRef = firebase.firestore().collection(collectionName);

  if (note.id) {
    return notesRef.doc(note.id).set(note);
  }

  return notesRef.add(note);
}

export function remove (note: INote) {
  const notesRef = firebase.firestore().collection(collectionName);
  return notesRef.doc(note.id).delete();
}
