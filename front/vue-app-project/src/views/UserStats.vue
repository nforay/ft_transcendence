<template>
  <div>
    <div class="user-profile-content">
      <div class="user-avatar-content">
        <img class="avatar" :src="avatar" alt="Avatar" />
      </div>
      <div class="username">
        <h1>{{ this.username }}</h1>
        <p class="bio">{{ this.bio }}</p>
      </div>
    </div>
    <div>
      <h2>elo = {{ this.elo }}</h2>
      <h2>Games won = {{ this.win }}</h2>
      <h2>Games lost = {{ this.lose }}</h2>
      <div id="container">
        <div id="first">
          <h2>Match History:</h2>
          <div id="scrollbox">
            <ul v-for="(res, i) in history" :key="i">
              {{ res.format(username) }}
            </ul>
          </div>
        </div>
        <div id="second">
          <div>
            <h2>Friend list:</h2>
            <div id="scrollbox" style="display: flex">
              <div style="margin: auto;" v-if="friends.length === 0">
                User doesn't have any friends
              </div>
              <a v-else :href="friend.url" v-for="(friend, i) in friends" :key="i">
                <div style="position: relative;">
                  <img class="friend-avatar" :src="friend.avatar">
                  <div :class="friend.htmlStatusClasses" :src="friend.statusImage"></div>
                </div>
                <a> {{ friend.username }} </a>
              </a>
            </div>
          </div>
          <div v-if="isfriend === true">
            <md-button @click="rmFriend()" class="md-accent">Remove Friend</md-button>
          </div>
          <div v-else-if="isloggeduser === false">
            <md-button @click="addFriend()" class="md-raised md-primary" :disabled="loading">Add Friend</md-button>
          </div>
        </div>
        <div id="clear"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { store, globalFunctions } from '@/store'
import router from '@/router'

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

  constructor () {
    super()
    this.username = 'Username'
    this.bio = 'No bio written'
    this.avatar = ''
    this.thisuser = false
  }

  async mounted (): Promise<void> {
    while (!store.state.requestedLogin) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    this.loading = false
    const token = globalFunctions.getToken()
    if (!this.$route.query.user && token === 'error') {
      router.push('/')
      return
    }

    this.thisuser = (!this.$route.query.user)
    this.username = (this.$route.query.user ? this.$route.query.user : store.state.username)

    const response = await fetch(
      'http://localhost:4000/user/username/' + this.username, {
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

    const friendlistResponse = await fetch(
      'http://localhost:4000/user/friends/name/' + this.username, {
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
        url: '/profile?user=' + friend.name,
        avatar: friend.avatar,
        htmlStatusClasses: 'status-icon status-' + friend.status
      }
    })

    // Useless? Can't we just check the list?
    if (store.state.userId !== '') {
      if (store.state.userId !== data.id) {
        this.isloggeduser = false
      }
      const resp = await fetch(
        'http://localhost:4000/user/friends/check/' + store.state.userId + '/' + this.username, {
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
      'http://localhost:4000/user/history/name/' + this.username, {
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
  }

  async addFriend (): Promise<void> {
    if (!this.$route.query.user || store.state.userId === '') {
      return
    }
    const response = await fetch(
      'http://localhost:4000/user/friends/' + store.state.userId + '/' + this.username, {
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
      'http://localhost:4000/user/friends/' + store.state.userId + '/' + this.username, {
        method: 'DELETE'
      }
    )
    if (response.ok) {
      this.isfriend = false
    }
  }
}
</script>

<style scoped>
div.user-profile-content {
  position: relative;
  width: 60%;
  min-width: 700px;
  height: 270px;
  margin: 0 auto;
  border: 1px solid #ccc;
}

div.user-avatar-content {
  position: relative;
  float: left;
}

img.avatar {
  display: block;
  width: 250px;
  height: 250px;
  margin: 10px 10px 10px 10px;
  border-radius: 30%;
  overflow: hidden;
}

img.friend-avatar {
  display: block;
  width: 50px;
  height: 50px;
  margin: 10px 10px 10px 10px;
  border-radius: 30%;
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
  right: 7px;
  width: 15px;
  height: 15px;
  margin: 0;
  padding: 0;
  border-radius: 50%;
}

td.user-name {
  vertical-align: top;
}

h1 {
  font-family: "Helvetica";
  font-size: 32px;
  text-align: left;
}

div.username {
  margin-left: 270px;
}

p.bio {
  width: 100%;
  word-wrap: break-word;
  font-style: italic;
  font-size: 18px;
  font-family: "Helvetica";
  text-align: left;
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
