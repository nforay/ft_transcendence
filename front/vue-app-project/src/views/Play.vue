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
            <span>ELO: 1500</span>
          </div>
          <div class="md-layout-item md-small-size-100">
            <span>W/L Ratio: 2.5</span>
          </div>
        </div>
      </md-card-content>
        <md-card-actions>
          <md-button v-if="!this.queueJoined" @click="joinQueue()" class="md-primary" :disabled="sending">Join queue</md-button>
          <md-button v-else @click="leaveQueue()" class="md-accent">Leave queue</md-button>
        </md-card-actions>
      <md-progress-bar md-mode="indeterminate" v-if="sending" />
    </md-card>
    <md-snackbar :md-active.sync="showSnack" >{{ this.errors[0] }}</md-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'

@Component
export default class Play extends Vue {
  queueJoined = false;
  public errors : string[] = []
  public showSnack = false
  public sending = false

  created () : void {
    document.addEventListener('beforeunload', this.leaveQueue)
  }

  mounted () : void {
    window.setInterval(() => {
      this.checkQueue()
    }, 1000)
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
    this.errors = []
    if (document.cookie.indexOf('Token') === -1) {
      this.errors.push('You must be logged in to join the queue')
      this.showSnack = true
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
      this.errors.push('You must be logged in to leave the queue')
      this.showSnack = true
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
