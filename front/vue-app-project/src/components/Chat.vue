<template>
  <div class="chat" id="chatboxdiv" @wheel="checkCanScroll">
    <div style="display: flex; min-height: 100%; justify-content: flex-end; flex-direction: column;">
      <ul v-for="message in messages" :key="message.id" style="margin: 0 10px 7px; padding: 0;">
        <span v-html="message.message.name"></span>
        <span v-if="message.message.isCommandResponse" v-html="message.message.msg"></span>
        <span v-else>{{ message.message.msg }}</span>
      </ul>
    </div>
    <div>
      <input v-model="chatMsg.msg" @keyup.enter="onInput" maxlength="250" placeholder="Send Message">
    </div>
  </div>
</template>

<script lang="ts">
import * as io from 'socket.io-client'
import Vue from 'vue'
import Component from 'vue-class-component'
import { globalFunctions } from '../store'

class ChatMessage {
  token = ''
  msg = ''
}

@Component
export default class Chat extends Vue {
  chatMsg = new ChatMessage()
  messages: any[] = []
  socket: any
  autoScrollInterval: any = null
  canAutoScroll = true

  created () : void {
    console.log('created')
    this.socket = io.connect('ws://localhost:8082')
    this.chatMsg.token = globalFunctions.getToken()
    this.socket.on('connect', () => {
      console.log('Connected to socket')
    })
    this.socket.on('recv_message', (data) => {
      let lines = []

      console.log(data)
      if (data.isCommandResponse) {
        lines = data.msg.split('\n')
      } else {
        lines = [data.msg]
      }

      for (const line of lines) {
        const cpy = data
        cpy.msg = line

        if (cpy.isCommandResponse) {
          cpy.msg = '<i style="color: #009100;">' + cpy.msg + '</i>'
        }

        if (cpy.name.length !== 0) {
          cpy.name = '<a href=\'#/\'>' + cpy.name + '</a>: ' //! Attention il ne faut pas de username avec du HTML sinon grosse faille
        }

        this.messages.push({
          id: this.messages.length === 150 ? this.messages[0].id : this.messages.length,
          message: { ...cpy }
        })
        if (this.messages.length === 151) {
          this.messages.shift()
        }
      }
      if (this.canAutoScroll) {
        this.autoScrollDiv()
      }
    })
    this.socket.emit('init', globalFunctions.getToken())
  }

  destroyed () {
    this.socket.disconnect()
  }

  onInput () : void {
    if (this.chatMsg.msg.length !== 0) {
      console.log(this.chatMsg)
      this.socket.emit('send_message', this.chatMsg)
      this.chatMsg.msg = ''
    }
  }

  autoScrollDiv () : void {
    this.$nextTick(() => {
      document.getElementById('chatboxdiv').scrollTop = document.getElementById('chatboxdiv').scrollHeight
    })
  }

  checkCanScroll () : void {
    const element = document.getElementById('chatboxdiv')
    if (!element) {
      return
    }

    if (element.scrollTop === (element.scrollHeight - element.clientHeight)) {
      this.canAutoScroll = true
    } else {
      this.canAutoScroll = false
    }
  }
}
</script>

<style lang="scss">
// #440054 fond violet
// #2D0033 surligné violet

.chat {
  position: absolute;
  bottom: 30px;
  right: 0;
  width: 400px;
  height: calc(25% - 30px);

  overflow-y: scroll;
  overflow-x: hidden;
  overflow-wrap: break-word;
  text-align: left;
  background-color: #eeeeee;
  color: #000000;

  a {
    color:rgb(255, 217, 0);
  }

  input {
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 30px;
    background-color: #ffffff;
    color: #000000;
  }
}
</style>
