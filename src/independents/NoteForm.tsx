import React from 'react';
import * as Notes from '../models/Notes';

interface INoteFormProps {
  note: Notes.INote;
  onCancel: (note: Notes.INote) => void;
  onChange: (note: Notes.INote) => void;
  onSubmit: (note: Notes.INote) => void;
}

interface INoteFormState {
  body: string;
}

export default class NoteForm extends React.PureComponent<INoteFormProps, INoteFormState> {
  constructor (props: Readonly<INoteFormProps>) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.onBodyChange = this.onBodyChange.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  public render () {
    return (
      <form
        onSubmit={this.onSubmit}
      >
        <textarea
          onChange={this.onBodyChange}
          value={this.props.note.body}
        />
        <button>{this.props.note.id ? 'Update' : 'Add'}</button>
        <button
          onClick={this.onCancelClick}
          type="button"
        >
          Cancel
        </button>
      </form>
    );
  }

  public onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    this.props.onSubmit({
      ...this.props.note,
    });
  }

  public onBodyChange (event: React.ChangeEvent<HTMLTextAreaElement>) {
    const body = event.currentTarget.value;
    this.setState({ body });
    this.props.onChange({
      ...this.props.note,
      body,
    });
  }

  public onCancelClick () {
    this.props.onCancel(this.props.note);
  }
}
