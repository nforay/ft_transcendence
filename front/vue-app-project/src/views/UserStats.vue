<template>
  <div>
    <div class="md-layout md-gutter">
      <div style="margin: 15px 0;" class="md-layout-item md-layout md-gutter md-alignment-top-center">
        <md-card style="min-width: 300px;" class="md-layout-item md-size-50">
          <md-card-header>
          </md-card-header>
          
          <div class="md-layout md-size-100">
            <md-card-media>
              <img style="border-radius: 5px;" class="user-profile-avatar" :src="avatar" alt="Avatar">
            </md-card-media>
            
            <div style="margin-left: 15px">
              <p style="margin-bottom: 10px" class="md-title">{{ this.username }}'s Profile</p>
              <p class="md-subheading" style="text-align: left;">{{ this.bio }}</p>
            </div>

            <md-card-content style="text-align: right;" class="md-layout md-layout-item md-alignment-center-right">
              <div class="md-layout-item" style="white-space: nowrap;">
                <span><h2><md-icon>emoji_events</md-icon>Elo - {{ this.elo }}</h2></span>
                <span><h2><md-icon class="history-win">add_box</md-icon>Wins - {{ this.win }}</h2></span>
                <span><h2><md-icon class="history-lose">indeterminate_check_box</md-icon>Loses - {{ this.lose }}</h2></span>
              </div>
            </md-card-content>
          </div>

          <md-card-actions>
            <div v-if="ingame && isloggeduser === false">
              <md-button class="md-primary" @click="spectate()" :disabled="loading">Spectate <md-icon>visibility</md-icon></md-button>
            </div>
            <div v-if="isfriend === true">
              <md-button @click="rmFriend()" class="md-accent" :disabled="loading">Remove Friend <md-icon>person_remove</md-icon></md-button>
            </div>
            <div v-else-if="isloggeduser === false">
              <md-button @click="addFriend()" class="md-primary" :disabled="loading">Add Friend <md-icon>person_add</md-icon></md-button>
            </div>
            <div v-if="blocked === false && isloggeduser === false">
              <md-button class="md-accent" @click="block()" :disabled="loading">Block <md-icon>person_off</md-icon></md-button>
            </div>
            <div v-else-if="isloggeduser === false">
              <md-button class="md-accent" @click="unblock()" :disabled="loading">Unblock <md-icon>person</md-icon></md-button>
            </div>
          </md-card-actions>
        </md-card>
      </div>
    </div>
    <div>
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-layout md-gutter">
          <div class="md-layout-item" style="margin: 5px 0;">
            <span class="md-title">Match History</span>
            <md-table style="max-height: 50vh;" v-if="history.length > 0" md-card>
              <md-table-row v-for="(res, i) in history" :key="i">
                <md-table-cell><span :class="getClass(res)"><md-icon :class="getClass(res)">{{ res.icon(username) }}</md-icon></span></md-table-cell>
                <md-table-cell><img class="friend-avatar" :src="res.avatarLeft(username)"></md-table-cell>
                <md-table-cell><span :class="getClass(res)">{{ res.format(username) }}</span></md-table-cell>
                <md-table-cell><img class="friend-avatar" :src="res.avatarRight(username)"></md-table-cell>
              </md-table-row>
            </md-table>
          </div>
          <div class="md-layout-item" style="margin: 5px 0;">
            <span class="md-title">Friend list</span>
            <md-table style="max-height: 50vh;" v-if="friends.length > 0" md-card>
              <md-table-row>
                <md-table-head class="md-xsmall-hide" style="position: relative; width: 50px;">Avatar</md-table-head>
                <md-table-head>Name</md-table-head>
                <md-table-head md-numeric>Elo</md-table-head>
                <md-table-head>Level</md-table-head>
              </md-table-row>
              <md-table-row style="cursor: pointer;" v-for="(friend, i) in friends" :key="i" @click="loadProfile(friend.username)">
                <md-table-cell style="width: 0;" class="md-xsmall-hide">
                  <div style="position: relative; width: 50px;">
                    <img class="friend-avatar" :src="friend.avatar">
                    <div :class="friend.htmlStatusClasses" :src="friend.statusImage"></div>
                  </div>
                </md-table-cell>
                <md-table-cell style="width: 0;">{{ friend.username }}</md-table-cell>
                <md-table-cell md-numeric><md-icon>emoji_events</md-icon>{{ friend.elo }}</md-table-cell>
                <md-table-cell style="width: 25%;">
                  LV {{ Math.floor(friend.level) }} - {{ Math.floor(Math.floor(getXpProgress(friend.level) * 100) / 100) }}%
                  <md-progress-bar md-mode="determinate" :md-value="getXpProgress(friend.level)"></md-progress-bar>
                </md-table-cell>
              </md-table-row>
            </md-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store, { globalFunctions } from '@/store'
import router from '@/router'
import { Watch } from 'vue-property-decorator'

class GameData {
  public player1Id = ''
  public player2Id = ''
  public player1Avatar = ''
  public player2Avatar = ''
  public player1Name = ''
  public player2Name = ''
  public player1Score = 0;
  public player2Score = 0;
  public player1Won = true

  constructor (player1Id: string, player2Id: string, player1Avatar: string, player2Avatar: string, player1Name: string, player2Name: string, score1: number, score2: number, player1Won: boolean) {
    this.player1Id = player1Id
    this.player2Id = player2Id
    this.player1Avatar = player1Avatar
    this.player2Avatar = player2Avatar
    this.player1Name = player1Name
    this.player2Name = player2Name
    this.player1Score = score1
    this.player2Score = score2
    this.player1Won = player1Won
  }

  format (username: string) : string {
    const userScore = (username === this.player1Name ? this.player1Score : this.player2Score)
    const opponentScore = (username === this.player1Name ? this.player2Score : this.player1Score)
    const userWon = (username === this.player1Name ? this.player1Won : !this.player1Won)
    const opponentName = (username === this.player1Name ? this.player2Name : this.player1Name)
    return `${username} ${userWon ? 'won' : 'lost'} ${userScore} - ${opponentScore} ${opponentName}`
  }

  icon (username: string) : string {
    if (username === this.player1Name ? this.player1Won : !this.player1Won) {
      return 'add_box'
    } else {
      return 'indeterminate_check_box'
    }
  }

  avatarLeft (username: string) : string {
    return `${username === this.player1Name ? this.player1Avatar : this.player2Avatar}`
  }

  avatarRight (username: string) : string {
    return `${username === this.player1Name ? this.player2Avatar : this.player1Avatar}`
  }
}

@Component
export default class UserProfile extends Vue {
  public username = ''
  public bio = ''
  public avatar = ''
  public elo = 100
  public win = 0
  public lose = 0
  public loading = true
  public history: GameData[] = []

  public friends: string[] = []

  public thisuser = false
  public isfriend = false
  public isloggeduser = true
  public blocked = false
  public ingame = false

  constructor () {
    super()
    this.username = 'Username'
    this.bio = 'No bio written'
    this.avatar = ''
    this.thisuser = false
  }

  getXpProgress (level: number) : number {
    return (level - Math.floor(level)) * 100
  }

  async mounted (): Promise<void> {
    while (!store.state.requestedLogin) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    this.loading = false
    const token = globalFunctions.getToken()
    if (!this.$route.query.user && token === 'error') {
      router.push('/').catch(() => { Function.prototype() })
      return
    }

    this.thisuser = (!this.$route.query.user)
    this.username = (this.$route.query.user ? this.$route.query.user.toString() : store.state.username)
    this.queryProfile(this.username)
  }

  async loadProfile (username: string): Promise<void> {
    if (username !== this.$route.query.user) {
      this.$router.push({ query: { user: username } })
    }
  }

  async spectate () {
    if (globalFunctions.getToken() === 'error') {
      store.commit('setPopupMessage', 'You must be logged in to spectate a game')
      return
    }

    const userGameIdResponse = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/game/player?name=${this.username}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${globalFunctions.getToken()}`
      }
    })
    if (!userGameIdResponse.ok) {
      store.commit('setPopupMessage', 'The game doesn\'t exist anymore')
      return
    }
    const id = (await userGameIdResponse.json()).id

    const gameJwtResponse = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/game/requestSpectate?id=${id}`, {
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
    window.localStorage.setItem('spectator', 'true')
    router.push('/game?id=' + id)
  }

  async queryProfile (username: string): Promise<void> {
    this.username = (this.$route.query.user ? this.$route.query.user.toString() : store.state.username)
    this.isloggeduser = true

    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/username/' + this.username, {
        method: 'GET'
      }
    )
    if (!response.ok) {
      return
    }
    const data = await response.json()
    this.bio = data.bio
    this.avatar = data.avatar
    this.elo = data.elo
    this.win = data.win
    this.lose = data.lose
    if (data.status === 'ingame')
      this.ingame = true

    const friendlistResponse = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/friends/name/' + this.username, {
        method: 'GET'
      }
    )
    if (!friendlistResponse.ok) {
      return
    }
    const friendlistData = await friendlistResponse.json()
    this.friends = friendlistData.map(friend => {
      return {
        username: friend.name,
        url: '/redirect?to=/profile?user=' + friend.name,
        avatar: friend.avatar,
        elo: friend.elo,
        level: friend.level,
        htmlStatusClasses: 'status-icon status-' + friend.status
      }
    })

    // Useless? Can't we just check the list?
    if (store.state.userId !== '') {
      if (store.state.userId !== data.id) {
        this.isloggeduser = false
      }
      const resp = await fetch(
        'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/friends/check/' + store.state.userId + '/' + this.username, {
          method: 'GET'
        }
      )
      if (!resp.ok) {
        return
      }
      const dat = await resp.json()
      this.isfriend = dat
    }

    const matchHistory = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/history/name/' + this.username, {
        method: 'GET'
      }
    )
    if (!matchHistory.ok) {
      return
    }
    const matchHistoryData = await matchHistory.json()
    this.history = matchHistoryData.map(match => {
      return new GameData(
        match.player1Id,
        match.player2Id,
        match.player1Avatar,
        match.player2Avatar,
        match.player1Name,
        match.player2Name,
        match.player1Score,
        match.player2Score,
        match.player1Won
      )
    })

    const isBlocked = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/isBlocked?name=' + this.username, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      }
    )
    if (!isBlocked.ok) {
      return
    }
    const idBlockedData = await isBlocked.json()
    this.blocked = idBlockedData.blocked;
  }

  async addFriend (): Promise<void> {
    if (!this.$route.query.user || store.state.userId === '') {
      return
    }
    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/friends/' + store.state.userId + '/' + this.username, {
        method: 'POST'
      }
    )
    if (response.ok) {
      this.isfriend = true
    }
  }

  async rmFriend (): Promise<void> {
    if (!this.$route.query.user || store.state.userId === '') {
      return
    }
    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/friends/' + store.state.userId + '/' + this.username, {
        method: 'DELETE'
      }
    )
    if (response.ok) {
      this.isfriend = false
    }
  }

  getClass (item : any) : string {
    if (this.username === item.player1Name ? item.player1Won : !item.player1Won) {
      return 'history-win'
    }
    return 'history-lose'
  }

  async block() {
    if (globalFunctions.getToken() === 'error') {
      return
    }
    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/block?name=' + this.username, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      }
    )
    if (!response.ok) {
      store.commit('setPopupMessage', 'This user is already blocked or doesn\'t exist.')
      return
    }
    store.commit('setPopupMessage', `${this.username} has been blocked.`)
    this.blocked = true
  }

  async unblock() {
    if (globalFunctions.getToken() === 'error') {
      return
    }
    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/unblock?name=' + this.username, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      }
    )
    if (!response.ok) {
      store.commit('setPopupMessage', 'This user wasn\'t blocked or doesn\'t exist.')
      return
    }
    store.commit('setPopupMessage', `${this.username} has been blocked.`)
    this.blocked = false
  }

  @Watch('$route')
  onRouteChange (to: any, from: any) : void {
    this.queryProfile(to.query.user)
  }
}
</script>

<style scoped>
img.friend-avatar {
  display: block;
  width: 50px;
  min-width: 50px;
  height: 50px;
  border-radius: 5px;
  overflow: hidden;
}

div.status-online {
  background-color: #4CAF50;
}

div.status-offline {
  background-color: #777777;
}

div.status-ingame {
  background-color: #F44336;
}

div.status-icon {
  position: absolute;
  bottom: -3px;
  left: 40px;
  width: 15px;
  height: 15px;
  margin: 0;
  padding: 0;
  border-radius: 50%;
}

.user-profile-avatar {
  width: 175px;
  height: 175px;
  object-fit: cover;
}

span.history-win {
  color: green;
}

span.history-lose {
  color: red;
}

.md-icon.history-win {
  color: #00800050;
}

.md-icon.history-lose {
  color: #ff000050;
}

#scrollbox {
  overflow-y: scroll;
  overflow-x: hidden;
  overflow-wrap: break-word;
  height: 200px;
  width: 200px;
}

#container {
  width: 400px;
  margin: auto;
}

#first {
  width: 200px;
  float: left;
  height: 200px;
}

#second {
  width: 200px;
  float: left;
  height: 200px;
}

#clear {
  clear: both;
}
</style>
