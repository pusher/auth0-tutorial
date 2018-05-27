import React, { Component } from 'react'
import { ChatManager, TokenProvider } from '@pusher/chatkit'
import { WebAuth } from 'auth0-js'
import { Router, Route } from 'react-router-dom'
import createHistory from 'history/createBrowserHistory'
import decodeToken from 'jwt-decode'
import moment from 'moment'
import axios from 'axios'

const history = createHistory()

class Auth {
  auth0 = new WebAuth({
    domain: 'bookercodes.eu.auth0.com',
    clientID: 'EZzK4011mOnTQT5wgFUt7cWr4lyF5Sth',
    redirectUri: 'http://localhost:3001/callback',
    audience: 'booker.codes',
    responseType: 'token id_token',
    scope: 'openid'
  })

  handleCallback() {
    this.auth0.parseHash((error, result) => {
      if (error) {
        console.error('Oh noes. An error occured: ', error.error)
        return
      }

      localStorage.setItem('access_token', result.accessToken)
      localStorage.setItem('id_token', result.idToken)
      history.replace('/')
    })
  }

  getAccessToken() {
    return localStorage.getItem('access_token')
  }

  hasTokenExpired(encodedToken) {
    const exp = moment.unix(decodeToken(encodedToken).exp)
    const now = moment()
    const secondsUntilExp = exp.diff(now, 'seconds')
    console.log('secondsUntilExp', secondsUntilExp)
    return secondsUntilExp <= 0
  }

  isAuthorized() {
    const token = localStorage.getItem('id_token')

    if (token && !this.hasTokenExpired(token)) {
      this.userId = decodeToken(token).sub
      return true
    }
    return false
  }

  authorize() {
    this.auth0.authorize()
  }
}

class MessageList extends Component {
  render = () => (
    <ul>
      {this.props.messages.map(message => (
        <li key={message.id}>{message.text}</li>
      ))}
    </ul>
  )
}

class MessageInput extends Component {
  render = () => (
    <form
      onSubmit={e => {
        e.preventDefault()
        this.props.onSubmit(this.inputEl.value)
        this.inputEl.value = ''
      }}
    >
      <input type="text" required ref={el => (this.inputEl = el)} />
      <input type="submit" />
    </form>
  )
}

class Home extends Component {
  constructor(props) {
    super()
    this.state = {
      messages: []
    }
  }

  componentDidMount = async () => {
    this.auth = new Auth()
    await this.createUser(this.props.userId)
    this.chatkit = new ChatManager({
      instanceLocator: 'v1:us1:e480b6f7-c2a7-4e60-ad6c-5b6fa330567d',
      userId: this.props.userId,
      tokenProvider: new TokenProvider({
        url: 'http://localhost:8080/token',
        headers: {
          Authorization: `Bearer ${this.auth.getAccessToken()}`
        }
      })
    })
    this.currentUser = await this.chatkit.connect()

    this.setState({
      currentUser: this.currentUser
    })
    await this.subscribeToRoom()
  }

  createUser = async id => {
    await axios.post(
      'http://localhost:8080/users',
      { id },
      {
        headers: {
          Authorization: `Bearer ${this.auth.getAccessToken()}`
        }
      }
    )
  }

  joinRoom = async () => {
    if (this.currentUser.rooms[0]) {
      return this.currentUser.rooms[0]
    }

    const joinableRooms = await this.currentUser.getJoinableRooms()
    return await this.currentUser.joinRoom({ roomId: joinableRooms[0].id })
  }

  subscribeToRoom = async () => {
    const room = await this.joinRoom()
    await this.currentUser.subscribeToRoom({
      roomId: room.id,
      hooks: {
        onNewMessage: message => {
          this.setState({
            messages: [...this.state.messages, message]
          })
        }
      }
    })
  }

  sendMessage = async text => {
    await this.currentUser.sendMessage({
      roomId: this.currentUser.rooms[0].id,
      text
    })
  }

  render = () => (
    <div>
      {this.state.currentUser ? (
        <p>
          Hello, {this.state.currentUser.name}{' '}
          <img src={this.state.currentUser.avatarURL} alt="hi" />
        </p>
      ) : null}
      <MessageList messages={this.state.messages} />
      <MessageInput onSubmit={this.sendMessage} />
    </div>
  )
}

class App extends React.Component {
  auth = new Auth()
  render = () => (
    <Router history={history}>
      <div>
        <Route
          exact
          path="/"
          render={() => {
            if (this.auth.isAuthorized()) {
              return <Home userId={this.auth.userId} />
            } else {
              this.auth.authorize()
              return <p>Loading...</p>
            }
          }}
        />
        <Route
          exact
          path="/callback"
          render={() => {
            this.auth.handleCallback()
            return <p>Loading...</p>
          }}
        />
      </div>
    </Router>
  )
}

export default App
