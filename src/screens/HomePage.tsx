import React from 'react';
import { NoteForm } from '../independents/NoteForm';
import firebase from '../middleware/firebase';
import * as Notes from '../models/Notes';

const noop: () => void = () => undefined;

interface INoteProps {
  note: Notes.INote;
  onDelete: (note: Notes.INote) => void;
  onEdit: (note: Notes.INote) => void;
}

function Note (props: INoteProps) {
  const onEdit = () => props.onEdit(props.note);
  const onDelete = () => props.onDelete(props.note);

  return (
    <div>
      <p>({props.note.id} / {props.note.userId || '(N/A)'})</p>
      <p>{props.note.body}</p>
      <p>
        <button
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
        >
          Delete
        </button>
      </p>
    </div>
  );
}

interface IWorkingTask {
  date: number;
  title: string;
}

interface IHomePageState {
  currentUser: {
    id: string;
    loggedIn: boolean;
    name: string;
    ready: boolean;
  };
  editingNote: Notes.INote;
  errors: string[];
  userNotes: Notes.INote[];
  working: boolean;
  workingTasks: IWorkingTask[];
}

export class HomePage extends React.Component<any, IHomePageState> {
  protected unsubscribeAuth = noop;
  protected unsubscribeNotes = noop;

  constructor (props: any) {
    super(props);
    this.onLogInClick = this.onLogInClick.bind(this);
    this.onLogOutClick = this.onLogOutClick.bind(this);
    this.onNewNoteChange = this.onNewNoteChange.bind(this);
    this.onNewNoteSubmit = this.onNewNoteSubmit.bind(this);
    this.onNoteEdit = this.onNoteEdit.bind(this);
    this.onNoteDelete = this.onNoteDelete.bind(this);
    this.state = {
      currentUser: {
        id: '',
        loggedIn: false,
        name: '',
        ready: false,
      },
      editingNote: Notes.createEmptyNote(),
      errors: [],
      userNotes: [],
      working: false,
      workingTasks: [],
    };
  }

  public render () {
    if (!this.state.currentUser.ready) {
      return (
        <div>…</div>
      );
    }

    return (
      <div>
        <h1>
          Home
          {this.state.working && '!'}
        </h1>
        {this.state.errors.length > 0 && (
          <div>
            {this.state.errors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}
        <h2>User</h2>
        {this.state.currentUser.loggedIn ? (
          <>
            <p>Welcome {this.state.currentUser.name}!</p>
            <p>
              <button
                onClick={this.onLogOutClick}
              >
                Log out
              </button>
            </p>
            <h2>New note</h2>
            <NoteForm
              note={this.state.editingNote}
              onChange={this.onNewNoteChange}
              onSubmit={this.onNewNoteSubmit}
            />
            <h2>Notes</h2>
            {this.state.userNotes.map((note) => (
              <Note
                key={note.id}
                note={note}
                onDelete={this.onNoteDelete}
                onEdit={this.onNoteEdit}
              />
            ))}
          </>
        ) : (
          <p>
            <button
              onClick={this.onLogInClick}
            >
              Log in
            </button>
          </p>
        )}
      </div>
    );
  }

  public componentDidMount () {
    this.unsubscribeAuth = this.connectAuth();
  }

  public componentWillUnmount () {
    this.unsubscribeAuth();
    this.unsubscribeNotes();
  }

  public async onLogInClick () {
    const email = 'test@google.com';
    const password = '123456';
    this.work('log in', () => {
      const p = firebase.auth().signInWithEmailAndPassword(email, password);
      return p;
    });
  }

  public async onLogOutClick () {
    this.work('log out', () => firebase.auth().signOut());
  }

  public onNewNoteChange (note: Notes.INote) {
    this.setState({ editingNote: note });
  }

  public async onNewNoteSubmit (note: Notes.INote) {
    if (!this.state.currentUser.loggedIn) {
      throw new Error('User must log in, in order to submit note');
    }
    note.userId = this.state.currentUser.id;

    this.setState({ editingNote: Notes.createEmptyNote() });

    const notesRef = firebase.firestore().collection('redux-todo-notes');
    const done = this.setWorking('add note');
    if (note.id) {
      await notesRef.doc(note.id).set(note);
    } else {
      await notesRef.add(note);
    }
    done();
  }

  public async onNoteEdit (note: Notes.INote) {
    this.setState({ editingNote: { ...note } });
  }

  public async onNoteDelete (note: Notes.INote) {
    const ok = window.confirm('Are you sure you want to delete this?');
    if (ok) {
      const notesRef = firebase.firestore().collection('redux-todo-notes');
      const done = this.setWorking('delete note');
      await notesRef.doc(note.id).delete();
      done();
    }
  }

  private connectAuth () {
    const done = this.setWorking('init auth');
    const unsubscribeAuth = firebase.auth().onAuthStateChanged({
      complete: noop,
      error: (error) => this.addError(error),
      next: (user: firebase.User | null) => {
        done();
        this.onAuth(user);
      },
    });
    return unsubscribeAuth;
  }

  private onAuth (user: firebase.User | null) {
    if (user) {
      this.setState({
        currentUser: {
          id: user.uid,
          loggedIn: true,
          name: user.displayName || '',
          ready: true,
        },
      });
    } else {
      this.setState({
        currentUser: {
          id: '',
          loggedIn: false,
          name: '',
          ready: true,
        },
      });
    }

    this.unsubscribeNotes();
    this.unsubscribeNotes = this.connectUserNotes();
  }

  private connectUserNotes () {
    if (!this.state.currentUser.loggedIn) {
      return noop;
    }

    const notesRef = firebase.firestore().collection('redux-todo-notes')
      .where('userId', '==', this.state.currentUser.id);
    const done = this.setWorking('init notes ref');
    const unsubscribeNotes = notesRef.onSnapshot({
      error: (error) => this.addError(error),
      next: (snapshot) => {
        done();
        const notes = snapshot.docs.map((v) => Notes.snapshotToRecord(v));
        this.setState({ userNotes: notes });
      },
    });
    return unsubscribeNotes;
  }

  private addError (error: Error) {
    console.error(error);

    const errors = [...this.state.errors];
    errors.push(error.message);
    this.setState({ errors });
  }

  private async work<T> (title: string, fn: () => Promise<T>): Promise<T | null> {
    const done = this.setWorking(title);
    try {
      const result = await fn();
      return result;
    } catch (error) {
      this.addError(error);
      return null;
    } finally {
      done();
    }
  }

  private setWorking (title = '') {
    const newTasks = [...this.state.workingTasks];
    const task: IWorkingTask = {
      date: Date.now(),
      title,
    };
    newTasks.push(task);
    this.setState({
      working: true,
      workingTasks: newTasks,
    });

    return () => {
      const { workingTasks } = this.state;
      const index = workingTasks.indexOf(task);

      // do nothing if closed
      if (index < 0) {
        return;
      }

      const finalTasks = [...workingTasks];
      finalTasks.splice(index, 1);

      const working = finalTasks.length > 0;
      this.setState({
        working,
        workingTasks: finalTasks,
      });
    };
  }
}
