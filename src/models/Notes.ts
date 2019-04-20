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
