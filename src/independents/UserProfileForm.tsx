import React from 'react';
import { IProfile } from '../models/Profiles';

interface IUserProfileFormProps {
  onChange: (profile: IProfile) => void;
  onSubmit: (profile: IProfile) => void;
  profile: Readonly<IProfile>;
}

export default class UserProfileForm extends React.Component<IUserProfileFormProps> {
  constructor (props: IUserProfileFormProps) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  public render () {
    return (
      <form
        onSubmit={this.onSubmit}
      >
        <label>
          {'Name: '}
          <input
            name="name"
            onChange={this.onChange}
            type="text"
            value={this.props.profile.name}
          />
        </label>
        <button>
          Save
        </button>
      </form>
    );
  }

  public onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    this.props.onSubmit(this.props.profile);
  }

  public onChange (event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    const profile = { ...this.props.profile };
    if (name === 'name') {
      profile.name = value;
    }
    this.props.onChange(profile);
  }
}
