<template>
  <div class="play md-layout">

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
    <div class="md-layout-item">
      <p class="md-headline" v-if="activeGames.length > 0" >Active Games</p>
    </div>
    <div class="md-layout md-gutter md-alignment-top-center" style="max-width: 95%;">
      <div class="spectate-size md-layout-item" @click="goToGame(game.id)" v-for="(game, i) in activeGames" :key="i">
        <md-card md-with-hover>
          <md-card-media md-ratio="4:3">
            <img src="../assets/game_preview.jpg" alt="preview">
          </md-card-media>

          <md-card-content>
            <div class="md-layout md-alignment-center-center">
              <div class="md-layout-item md-alignment-center-left">
                <md-avatar class="md-large" style="border-radius: 5%; object-fit: cover;">
                  <img class="leaderboard-avatar" :src="userAvatar(game.player1Id)">
                </md-avatar>
              </div>
              <div class="md-layout-item md-alignment-center-center md-small-hide">
                <p class="md-headline">{{ game.player1Score }} - {{ game.player2Score }}</p>
              </div>
              <div class="md-layout-item md-alignment-center-right">
                <md-avatar class="md-large" style="border-radius: 5%; object-fit: cover;">
                  <img class="leaderboard-avatar" :src="userAvatar(game.player2Id)">
                </md-avatar>
              </div>
            </div>
          </md-card-content>
        </md-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'
import store, { globalFunctions } from '../store'

@Component
export default class Play extends Vue {
  queueJoined = false;
  public sending = false
  public elo = 100
  public wlratio = 1.0
  public activeGames: Array<any> = []

  async created () : Promise<void> {
    document.addEventListener('beforeunload', this.leaveQueue)

    const activeGamesResponsse = await fetch('http://localhost:4000/game/active', {
      method: 'GET'
    })
    if (!activeGamesResponsse.ok) {
      return
    }
    const data = await activeGamesResponsse.json()
    this.activeGames = data.games
  }

  async goToGame (id: string) {
    if (globalFunctions.getToken() === 'error') {
      store.commit('setPopupMessage', 'You must be logged in to spectate a game')
      return
    }
    const gameJwtResponse = await fetch('http://localhost:4000/game/requestSpectate?id=' + id, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + globalFunctions.getToken()
      }
    })
    if (!gameJwtResponse.ok) {
      store.commit('setPopupMessage', 'The game doesn\'t exist anymore')
      return
    }
    const data = await gameJwtResponse.json()
    window.localStorage.setItem('gameJwt', data.gameJwt)
    router.push('/game?id=' + id + '&spectate=1')
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
    this.wlratio = Math.round(data.win / Math.max(data.lose, 1) * 100) / 100
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
      router.push(`/game?id=${data.gameId}`)
      window.localStorage.setItem('gameJwt', data.gameJwt)
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

  userAvatar (id: string) : string {
    return 'http://localhost:4000/user/avatar/' + id
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

  img.leaderboard-avatar {
    border-radius: 5% !important;
    object-fit: cover;
  }

  @media screen and (min-width: 1920px) {
    .spectate-size {
      min-width: 15vw;
      max-width: 15vw;
      flex: 0 1 15vw;
    }
  }

  @media screen and (max-width: 1920px) {
    .spectate-size {
      min-width: 290px;
      max-width: 290px;
      flex: 0 1 290px;
    }
  }
</style>
