import React, { Component } from 'react'
import axios from 'axios'
import { ChatManager, TokenProvider } from '@pusher/chatkit'
import auth from './common/auth'
import MessageList from './components/MessageList'
import MessageInput from './components/MessageInput'

class Home extends Component {
  constructor(props) {
    super()
    this.state = {
      messages: []
    }
  }

  componentDidMount = async () => {
    await this.createUser(this.props.userId)
    this.chatkit = new ChatManager({
      instanceLocator: 'v1:us1:e480b6f7-c2a7-4e60-ad6c-5b6fa330567d',
      userId: this.props.userId,
      tokenProvider: new TokenProvider({
        url: 'http://localhost:8080/token',
        headers: {
          Authorization: `Bearer ${auth.getAccessToken()}`
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
          Authorization: `Bearer ${auth.getAccessToken()}`
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

export default Home
