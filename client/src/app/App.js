import React from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { BrowserRouter as Router, Route } from "react-router-dom";

import { GameReducer } from '../reducers';
import { SocketService } from '../services';

import Style from './style.module.css';
import { Game } from './game';
import { Cover } from './elements';

class App extends React.Component {
  constructor() {
    super();

    this.store = createStore(GameReducer, composeWithDevTools(applyMiddleware(thunk)));
    this.store.dispatch(SocketService.startService());
  }

  render() {
    return (
      <Router>
        <Provider store={this.store}>
          <div className={Style.app}>
            <Route path={["/:roomName", "/"]}>
              <Cover />
              {/* Menu */}
              <Game socketService={SocketService} />
            </Route>
          </div>
        </Provider>
      </Router>
    );
  }
}

export { App };
