import firebase from '../middleware/firebase';

export function signInWithEmail (email: string, password: string) {
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

export function signOut () {
  return firebase.auth().signOut();
}
