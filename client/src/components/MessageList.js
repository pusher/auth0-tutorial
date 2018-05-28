import React, { Component } from 'react'

class MessageList extends Component {
  render = () => (
    <ul>
      {this.props.messages.map(message => (
        <li key={message.id}>{message.text}</li>
      ))}
    </ul>
  )
}

export default MessageList
