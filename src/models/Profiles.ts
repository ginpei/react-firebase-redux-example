import firebase from '../middleware/firebase';
import { noop } from '../misc';

export interface IProfile {
  id: string;
  message: string;
  name: string;
}

export const emptyProfile: Readonly<IProfile> = Object.freeze({
  id: '',
  message: '',
  name: '',
});

export function saveProfile (profile: IProfile) {
  const userId = profile.id;
  if (!userId) {
    throw new Error('Profile must have user ID');
  }
  const profileRef = firebase.firestore().collection('users').doc(userId);
  return profileRef.set(profile);
}

export function connectProfile (
  userId: string,
  onNext: (snapshot: firebase.firestore.DocumentSnapshot) => void,
  onError: (error: Error) => void = noop,
  onEach: () => void = noop,
): () => void {
  if (!userId) {
    return noop;
  }

  const userRef = firebase.firestore().collection('users').doc(userId);
  const unsubscribeNotes = userRef.onSnapshot(
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

export function snapshotToProfile (
  snapshot: firebase.firestore.DocumentSnapshot,
): IProfile {
  const data = snapshot.data()!;
  return {
    id: data.id || '',
    message: data.message || '',
    name: data.name || '',
  };
}
