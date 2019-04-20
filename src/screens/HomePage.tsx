import React from 'react';
import { connect } from 'react-redux';
import { NoteForm } from '../independents/NoteForm';
import firebase from '../middleware/firebase';
import { noop } from '../misc';
import * as CurrentUser from '../models/CurrentUser';
import * as Errors from '../models/Errors';
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
  addError: (error: Errors.AnyError) => void;
  clearError: () => void;
  currentUser: CurrentUser.ICurrentUserState;
  errors: Errors.IErrorLog[];
  setCurrentUser: (user: firebase.User | null) => void;
}

interface IHomePageState {
  editingNote: Notes.INote;
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
    this.onClearErrorClick = this.onClearErrorClick.bind(this);
    this.onLogInClick = this.onLogInClick.bind(this);
    this.onLogOutClick = this.onLogOutClick.bind(this);
    this.onNewNoteChange = this.onNewNoteChange.bind(this);
    this.onNewNoteSubmit = this.onNewNoteSubmit.bind(this);
    this.onNewNoteCancel = this.onNewNoteCancel.bind(this);
    this.onNoteEdit = this.onNoteEdit.bind(this);
    this.onNoteDelete = this.onNoteDelete.bind(this);
    this.state = {
      editingNote: Notes.createEmptyNote(),
      userNotes: [],
      working: false,
    };

    this.workManager.onWork = (working) => this.setState({ working });
    this.workManager.onError = (error) => this.props.addError(error);
  }

  public render () {
    if (!this.props.currentUser.ready) {
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
        <p>
          <button
            onClick={this.onFooClick}
          >
            Foo
          </button>
        </p>
        {this.props.errors.length > 0 && (
          <div>
            <button
              onClick={this.onClearErrorClick}
            >
              Clear
            </button>
            <ul>
              {this.props.errors.map(({ error, occurredAt }) => (
                <li key={occurredAt}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}
        <h2>User</h2>
        {this.props.currentUser.loggedIn ? (
          <>
            <p>Welcome {this.props.currentUser.name}!</p>
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
    this.props.addError(new Error('This is a dummy error'));
  }

  public onClearErrorClick () {
    this.props.clearError();
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
    if (!this.props.currentUser.loggedIn) {
      throw new Error('User must log in, in order to submit note');
    }
    note.userId = this.props.currentUser.id;

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
      (error) => this.props.addError(error),
      () => done(),
    );
    return unsubscribeAuth;
  }

  private onAuth (user: firebase.User | null) {
    this.props.setCurrentUser(user);
    this.unsubscribeNotes();
    this.unsubscribeNotes = this.connectUserNotes();
  }

  private connectUserNotes () {
    const done = this.workManager.start('init notes ref');
    const unsubscribeNotes = Notes.connectUserNotes(
      this.props.currentUser.id,
      (snapshot) => this.setState({
        userNotes: snapshot.docs.map((v) => Notes.snapshotToRecord(v)),
      }),
      (error) => this.props.addError(error),
      () => done(),
    );
    return unsubscribeNotes;
  }
}

export default connect(
  (state: IAppState) => ({
    currentUser: state.currentUser,
    errors: state.errors,
  }),
  (dispatch: AppDispatch) => ({
    addError: (error: Errors.AnyError) => dispatch(Errors.add(error)),
    clearError: () => dispatch(Errors.clear()),
    setCurrentUser: (user: firebase.User | null) => dispatch(CurrentUser.set(user)),
  }),
)(HomePage);
