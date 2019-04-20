import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createAppStore } from './models/store';
import HomePage from './screens/HomePage';

class App extends Component {
  protected store = createAppStore();

  public render () {
    return (
      <Provider
        store={this.store}
      >
        <HomePage/>
      </Provider>
    );
  }
}

export default App;
