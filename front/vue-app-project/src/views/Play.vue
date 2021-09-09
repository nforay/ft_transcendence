<template>
  <div class="play">
    <button @click="createRoom()">Send test message</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store from '../store'
import io from 'socket.io-client'

export class WebSocketMessage {
  type: string
  data: any

  constructor (type: string, data: any) {
    this.type = type
    this.data = data
  }
}

@Component
export default class Play extends Vue {
  socket: any
  messages: Array<WebSocketMessage> = []

  created () : void {
    this.socket = io('localhost:4001')
  }

  sendMessage (message: WebSocketMessage) : void {
    if (!this.socket || !this.socket.connected) {
      this.messages.push(message)
    } else {
      this.socket.emit(message.type, JSON.stringify(message.data))
    }
  }

  initConnection () : void {
    this.socket = io.connect('localhost:4001')
    this.socket.on('connection', () => {
      this.messages.forEach(message => {
        this.socket.send(JSON.stringify(message))
      })
      this.messages = []
    })
    this.socket.on('message', (message: string) => {
      const data = JSON.parse(message)
      console.log('Message recieved: ' + data)
    })
  }

  createRoom () : void {
    if (!this.socket || !this.socket.connected) {
      this.initConnection()
    }
    this.sendMessage(new WebSocketMessage('echo', { message: store.state.userId }))
  }
}

</script>

<style lang="scss" scoped>
</style>
