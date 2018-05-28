import React, { Component } from 'react'
import { Router, Route } from 'react-router-dom'
import auth from './common/auth'
import history from './common/history'
import Story from './Story'

class App extends Component {
  render = () => (
    <Router history={history}>
      <div>
        <Route
          exact
          path="/"
          render={() => {
            if (auth.isAuthorized()) {
              return <Story userId={auth.userId} />
            } else {
              auth.authorize()
              return <p>Loading...</p>
            }
          }}
        />
        <Route
          exact
          path="/callback"
          render={() => {
            auth.handleCallback()
            return <p>Loading...</p>
          }}
        />
      </div>
    </Router>
  )
}

export default App
