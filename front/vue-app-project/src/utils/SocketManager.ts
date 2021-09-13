import * as io from 'socket.io-client'
import { Socket } from 'socket.io-client'

export class SocketMessage {
  event: string
  data: any

  constructor (event: string, data: any) {
    this.event = event
    this.data = data
  }
}

export class SocketManager {
  private socket: typeof Socket
  private messages: SocketMessage[] = []

  constructor (url: string) {
    this.socket = io.connect(url)
    this.socket.on('connect', () => {
      this.messages.forEach(message => {
        this.socket.emit(message.event, message.data)
      })
      this.messages = []
    })
  }

  public on (event: string, callback: (data: any) => void) {
    this.socket.on(event, callback)
  }

  public sendMessage (event: string, data: any) {
    if (this.socket.connected) {
      this.socket.emit(event, data)
    } else {
      this.messages.push(new SocketMessage(event, data))
    }
  }
}
