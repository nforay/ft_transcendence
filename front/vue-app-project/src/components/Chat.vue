<template>
  <div class="chat-pos">
    <header class="chat-header">
      #{{ channel }}
    </header>
    <div class="chat" id="chatboxdiv" @wheel="checkCanScroll">
      <div v-if="recievedChallenges.length > 0" class="md-elevation-4" style="position: fixed; width: 20%; background-color: white;">
        <div class="md-layout md-size-100">
          <div class="md-layout md-alignment-center-left md-size-100">
            <div class="md-layout-item">
              <p style="margin-left: 5px;" class="md-subheading">{{ recievedChallenges[0].sender }} is challenging you</p>
            </div>
            <div class="md-alignment-center-right">
                <md-button class="md-icon-button md-mini" @click="acceptChallenge"><md-icon>done</md-icon></md-button>
                <md-button class="md-icon-button md-mini" @click="declineChallenge"><md-icon>close</md-icon></md-button>
            </div>
          </div>
          <div class="md-layout-item md-size-100">
            <md-progress-bar :md-value="recievedChallenges[0].expirePercentage" />
          </div>
        </div>
      </div>
      <div style="display: flex; min-height: 100%; justify-content: flex-end; flex-direction: column;">
        <ul v-for="message in messages" :key="message.id" style="margin: 0 10px 7px; padding: 0;">
          <md-menu md-direction="bottom-start" md-size="small">
            <span md-menu-trigger style="color: #478ee6; cursor: pointer;" v-if="!message.message.isCommandResponse">{{ message.message.name + ':'}}&nbsp;</span>
            <md-menu-content>
              <md-menu-item @click="redirectTo(`/profile?user=${message.message.name}`)">
                <md-icon>person</md-icon><span>{{ message.message.name }}'s Profile</span>
              </md-menu-item>
              <md-menu-item @click="challenge(message.message.name)"><md-icon>supervisor_account</md-icon><span>Challenge {{ message.message.name }}</span></md-menu-item>
            </md-menu-content>
          </md-menu>
          <span v-if="message.message.isCommandResponse" v-html="message.message.msg"></span>
          <span v-else>{{ message.message.msg }}</span>
        </ul>
      </div>
    </div>
    <md-field class="chat-input">
      <md-icon>question_answer</md-icon>
      <label>Send a message</label>
      <md-input v-model="chatMsg.msg" @keyup.enter="onInput" maxlength="250"></md-input>
    </md-field>
  </div>
</template>

<script lang="ts">
import * as io from 'socket.io-client'
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'
import store, { globalFunctions } from '../store'

class ChatMessage {
  token = ''
  msg = ''
}

class RecievedChallengeData {
  public sender: string
  public expireDate: number
  public originExpiresIn: number
  public expirePercentage = 100

  constructor (sender: string, expireDate: number) {
    this.sender = sender
    this.expireDate = expireDate
    this.originExpiresIn = expireDate - new Date().getTime()
  }

  public get isExpired (): boolean {
    return this.expireDate < new Date().getTime()
  }

  public updateExpirePercentage (): void {
    this.expirePercentage = (this.expireDate - new Date().getTime()) / this.originExpiresIn * 100
  }
}

@Component
export default class Chat extends Vue {
  chatMsg = new ChatMessage()
  messages: any[] = []
  socket: any
  autoScrollInterval: any = null
  canAutoScroll = true
  channel = 'general'
  listenSendChallengeResponse = false

  recievedChallenges: RecievedChallengeData[] = []

  public redirectTo (url: string) : void {
    router.push(url).catch(() => { Function.prototype() })
  }

  public async challenge (name: string) : Promise<void> {
    if (globalFunctions.getToken() === 'error') {
      store.commit('logout')
      store.commit('expireToken')
      return
    }
    this.listenSendChallengeResponse = true
    this.socket.emit('sendChallengeRequest', { token: globalFunctions.getToken(), to: name })
  }

  updateReceivedChallenges () : void {
    if (!this.recievedChallenges) {
      return
    }

    this.recievedChallenges = this.recievedChallenges.filter(challenge => !challenge.isExpired)
    if (this.recievedChallenges.length > 0) {
      this.recievedChallenges[0].updateExpirePercentage()
    }
  }

  mounted () {
    this.updateReceivedChallenges()
    setInterval(() => {
      this.updateReceivedChallenges()
    }, 100)
  }

  created () : void {
    this.socket = io.connect('ws://localhost:8082')
    this.chatMsg.token = globalFunctions.getToken()
    this.socket.on('recv_message', (data) => {
      let lines : string[] = []

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
    this.socket.on('switch_channel', (data) => {
      this.channel = data.channel
    })
    this.socket.on('sendChallengeResponse', (data) => {
      if (!this.listenSendChallengeResponse) {
        return
      }
      this.listenSendChallengeResponse = false
      if (data.success) {
        store.commit('setPopupMessage', 'Duel request has been sent to ' + data.to + '.')
      } else {
        store.commit('setPopupMessage', 'Duel request failed to be sent.')
      }
    })
    this.socket.on('recieveChallengeRequest', (data) => {
      store.commit('setPopupMessage', 'Duel request from ' + data.from + '.')
      this.recievedChallenges.push(new RecievedChallengeData(data.from, new Date().getTime() + data.expiresIn))
    })
    this.socket.on('challengeGameStarting', (data) => {
      if (!data.success) {
        store.commit('setPopupMessage', 'Failed to accept duel request.')
        this.recievedChallenges.shift()
        return
      }

      this.recievedChallenges.length = 0
      router.push('/game?id=' + data.gameId).catch(() => { Function.prototype() })
      window.localStorage.setItem('gameJwt', data.gameJwt)
    })
    this.socket.emit('init', globalFunctions.getToken())
  }

  destroyed () {
    this.socket.disconnect()
  }

  onInput () : void {
    if (this.chatMsg.msg.length !== 0) {
      this.socket.emit('send_message', this.chatMsg)
      this.chatMsg.msg = ''
    }
  }

  autoScrollDiv () : void {
    this.$nextTick(() => {
      document.getElementById('chatboxdiv')!.scrollTop = document.getElementById('chatboxdiv')!.scrollHeight
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

  acceptChallenge () : void {
    if (globalFunctions.getToken() === 'error') {
      store.commit('logout')
      store.commit('expireToken')
      return
    }

    this.socket.emit('acceptChallengeRequest', { token: globalFunctions.getToken(), sender: this.recievedChallenges[0].sender })
  }

  declineChallenge () : void {
    if (globalFunctions.getToken() === 'error') {
      store.commit('logout')
      store.commit('expireToken')
      return
    }

    this.socket.emit('declineChallengeRequest', { token: globalFunctions.getToken(), sender: this.recievedChallenges[0].sender })
    this.recievedChallenges.splice(0, 1)
  }
}
</script>

<style lang="scss">
// #440054 fond violet
// #2D0033 surligné violet

.chat-pos .chat {
  position: fixed;
  top: calc(49px + 36px);
  right: 0;
}

.chat-header {
  height: 36px;
  font-size: 22px;
  padding: 7px;
  position: fixed;
  width: 20%;
  border-bottom: 1px solid #777;
  background-color: #fff;
  top: calc(49px);
  right: 0;
}

.chat {
  width: 20%;
  height: calc(100% - 49px - 36px - 70px);

  overflow-y: scroll;
  overflow-x: hidden;
  overflow-wrap: break-word;
  text-align: left;
  background-color: #fff;
  color: #000000;

  a {
    color:rgb(255, 217, 0);
  }

}

.chat-input {
  position: fixed !important;
  top: calc(100% - 75px);
  background-color: #fff;
  width: 20% !important;
}
</style>
