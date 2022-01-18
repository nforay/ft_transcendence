<template>
  <div class="play">

    <md-card class="md-layout-item md-size-50 md-small-size-50 md-align-center">
      <md-card-header>
        <div class="md-title md-layout-item md-small-size-100">Matchmaking</div>
      </md-card-header>
      <md-card-content>
        <br/>
        <div class="md-layout md-gutter">
          <div class="md-layout-item md-small-size-100">
            <span>ELO: {{ this.elo }}</span>
          </div>
          <div class="md-layout-item md-small-size-100">
            <span>W/L Ratio: {{this.wlratio }}</span>
          </div>
        </div>
      </md-card-content>
        <md-card-actions>
          <md-button v-if="!this.queueJoined" @click="joinQueue()" class="md-primary" :disabled="sending">Join queue</md-button>
          <md-button v-else @click="leaveQueue()" class="md-accent">Leave queue</md-button>
        </md-card-actions>
      <md-progress-bar md-mode="indeterminate" v-if="sending" />
    </md-card>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'
import store from '../store'

@Component
export default class Play extends Vue {
  queueJoined = false;
  public sending = false
  public elo = 100
  public wlratio = 1.0

  created () : void {
    document.addEventListener('beforeunload', this.leaveQueue)
  }

  async mounted () : Promise<void> {
    window.setInterval(() => {
      this.checkQueue()
    }, 1000)
    while (!store.state.requestedLogin) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    const resp = await fetch('http://localhost:4000/user/' + store.state.userId, {
      method: 'GET'
    })
    if (!resp.ok) {
      return
    }
    const data = await resp.json()
    this.elo = data.elo
    this.wlratio = data.lose === 0 ? Math.max(data.win, 1) : Math.round(data.win / data.lose * 100) / 100
  }

  async checkQueue () : Promise<void> {
    if (!this.queueJoined || document.cookie.indexOf('Token') === -1) {
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/matchmaking/poll', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      return
    }
    const data = await response.json()
    if (data.found) {
      this.queueJoined = false
      router.push(`/game?id=${data.gameId}&gameToken=${data.gameJwt}`)
    }
  }

  async joinQueue () : Promise<void> {
    if (document.cookie.indexOf('Token') === -1) {
      store.commit('setPopupMessage', 'You must be logged in to join the queue')
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/matchmaking/join', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      return
    }
    const data = await response.json()
    this.queueJoined = data.accepted
    this.sending = data.accepted
  }

  async leaveQueue () : Promise<void> {
    if (document.cookie.indexOf('Token') === -1) {
      store.commit('setPopupMessage', 'You must be logged in to leave the queue')
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/matchmaking/leave', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      return
    }
    const data = await response.json()
    this.queueJoined = !data.left
    this.sending = !data.left
  }
}

</script>

<style lang="scss" scoped>
  .md-card {
    margin-top: 16px;
  }

  .play {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
