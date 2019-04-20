import React from 'react';
import { connect } from 'react-redux';
import { NoteForm } from '../independents/NoteForm';
import firebase from '../middleware/firebase';
import { noop } from '../misc';
import * as Notes from '../models/Notes';
import { AppDispatch, IAppState } from '../models/store';
import WorkManager from '../WorkManager';

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

interface IHomePageProps {
  dispatch: AppDispatch;
  foo: string;
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
}

export class HomePage extends React.Component<IHomePageProps, IHomePageState> {
  protected unsubscribeAuth = noop;
  protected unsubscribeNotes = noop;
  protected workManager = new WorkManager();

  constructor (props: any) {
    super(props);
    this.onFooClick = this.onFooClick.bind(this);
    this.onLogInClick = this.onLogInClick.bind(this);
    this.onLogOutClick = this.onLogOutClick.bind(this);
    this.onNewNoteChange = this.onNewNoteChange.bind(this);
    this.onNewNoteSubmit = this.onNewNoteSubmit.bind(this);
    this.onNewNoteCancel = this.onNewNoteCancel.bind(this);
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
    };

    this.workManager.onWork = (working) => this.setState({ working });
    this.workManager.onError = (error) => this.addError(error);
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
          [{this.props.foo}]
          {this.state.working && '!'}
        </h1>
        <p>
          <button
            onClick={this.onFooClick}
          >
            Foo
          </button>
        </p>
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
              onCancel={this.onNewNoteCancel}
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

  public onFooClick () {
    if (this.props.foo === 'bar') {
      this.props.dispatch({ type: 'FOO_BOO' });
    } else {
      this.props.dispatch({ type: 'FOO_BAR' });
    }
  }

  public onLogInClick () {
    const email = 'test@google.com';
    const password = '123456';
    const p = firebase.auth().signInWithEmailAndPassword(email, password);
    this.workManager.run('log in', p);
  }

  public onLogOutClick () {
    this.workManager.run('log out', firebase.auth().signOut());
  }

  public onNewNoteChange (note: Notes.INote) {
    this.setState({ editingNote: note });
  }

  public onNewNoteSubmit (note: Notes.INote) {
    if (!this.state.currentUser.loggedIn) {
      throw new Error('User must log in, in order to submit note');
    }
    note.userId = this.state.currentUser.id;

    this.setState({ editingNote: Notes.createEmptyNote() });

    const notesRef = firebase.firestore().collection('redux-todo-notes');
    if (note.id) {
      this.workManager.run('update note', notesRef.doc(note.id).set(note));
    } else {
      this.workManager.run('add note', notesRef.add(note));
    }
  }

  public onNewNoteCancel (note: Notes.INote) {
    this.setState({ editingNote: Notes.createEmptyNote() });
  }

  public onNoteEdit (note: Notes.INote) {
    this.setState({ editingNote: { ...note } });
  }

  public onNoteDelete (note: Notes.INote) {
    const ok = window.confirm('Are you sure you want to delete this?');
    if (ok) {
      const notesRef = firebase.firestore().collection('redux-todo-notes');
      this.workManager.run('delete note', notesRef.doc(note.id).delete());
    }
  }

  private connectAuth () {
    const done = this.workManager.start('init auth');
    const unsubscribeAuth = firebase.auth().onAuthStateChanged(
      (user) => this.onAuth(user),
      (error) => this.addError(error),
      () => done(),
    );
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
    const done = this.workManager.start('init notes ref');
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

  private addError (error: Error | firebase.auth.Error) {
    console.error(error);

    const errors = [...this.state.errors];
    errors.push(error.message);
    this.setState({ errors });
  }
}

export default connect(
  (state: IAppState) => ({
    foo: state.foo,
  }),
)(HomePage);
