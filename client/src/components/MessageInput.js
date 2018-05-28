import React, { Component } from 'react'

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

export default MessageInput
