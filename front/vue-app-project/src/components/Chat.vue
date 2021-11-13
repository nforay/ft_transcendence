<template>
  <div class="chat" id="chatboxdiv" @wheel="stopAutoScroll">
    <ul v-for="message in messages" :key="message.id">
      <span v-html="message.message.name"></span>{{ message.message.msg }}
    </ul>
    <input v-if="identification" v-model="chatMsg.msg" @keyup.enter="onInput" maxlength="250" placeholder="chat here">
    <input v-else v-model="chatMsg.msg" @keyup.enter="nameEntered" maxlength="12" placeholder="enter name to chat">
  </div>
</template>

<script>
import * as io from 'socket.io-client'

class ChatMessage {
  name = ''
  msg = ''
}

export default {
  data: function () {
    return {
      identification: false,
      chatMsg: new ChatMessage(),
      messages: [],
      socket: io.connect('ws://localhost:8082')
    }
  },
  created: function () {
    this.autoScrollDiv()
    this.socket.on('connect', () => {
      console.log('Connected to socket')
    })
    this.socket.on('recv_message', (data) => {
      console.log('Message reveived on socket <' + data.name + ', ' + data.msg + '>')
      if (data.name.length !== 0) {
        data.name = '<a href=\'#/\'>' + data.name + '</a>: ' //! Attention il ne faut pas de username avec du HTML sinon grosse faille
      }
      this.messages.push({
        id: this.messages.length === 150 ? this.messages[0].id : this.messages.length,
        message: data
      })
      if (this.messages.length === 151) {
        this.messages.shift()
      }
      this.autoScrollDiv()
    })
  },
  methods: {
    onInput: function () {
      if (this.chatMsg.msg.length !== 0) {
        this.socket.emit('send_message', this.chatMsg)
        this.chatMsg.msg = ''
      }
    },
    nameEntered: function () {
      if (this.chatMsg.msg.length !== 0) {
        this.chatMsg.name = this.chatMsg.msg
        this.chatMsg.msg = ''
        this.identification = true
        this.socket.emit('identification', this.chatMsg.name)
      }
    },
    autoScrollDiv: function () {
      if (this.autoScrollInterval === null) {
        this.autoScrollInterval = setInterval(() => {
          document.getElementById('chatboxdiv').scrollTop = document.getElementById('chatboxdiv').scrollHeight
        }, 50)
      }
    },
    stopAutoScroll: function () {
      clearInterval(this.autoScrollInterval)
      this.autoScrollInterval = null
    }
  }
}
</script>

<style lang="scss">
// #440054 fond violet
// #2D0033 surligné violet

.chat {
  overflow:scroll;
  overflow-wrap: break-word;
  width: 400px;
  height: 400px;
//   border: thin #000 solid;
  text-align: left;
  background-color: rgb(34, 34, 34);
  color: #ffffff;

  a {
    color:rgb(255, 217, 0);
  }

  input {
    background-color: #440054;
    color: #ffffff;
  }
}
</style>
