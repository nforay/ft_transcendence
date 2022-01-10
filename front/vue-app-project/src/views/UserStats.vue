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
              {{ res.value }}
            </ul>
          </div>
        </div>
        <div id="second">
          <div>
            <h2>Friend list:</h2>
            <div id="scrollbox">
              <ul v-for="(friend, i) in friends" :key="i">
                <span v-html="friend"></span>
              </ul>
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

@Component
export default class UserProfile extends Vue {
  public username = ''
  public bio = ''
  public avatar = ''
  public elo = 100
  public win = 0
  public lose = 0
  public loading = true
  public history: any[] = [
    { id: 0, value: 'win' },
    { id: 1, value: 'lose' },
    { id: 2, value: 'lose' },
    { id: 3, value: 'win' },
    { id: 4, value: 'win' },
    { id: 5, value: 'win' },
    { id: 6, value: 'win' },
    { id: 7, value: 'win' },
    { id: 8, value: 'win' },
    { id: 9, value: 'win' },
    { id: 10, value: 'win' },
    { id: 11, value: 'win' },
    { id: 12, value: 'win' },
    { id: 13, value: 'win' },
    { id: 14, value: 'win' },
    { id: 15, value: 'win' },
    { id: 16, value: 'win' },
    { id: 17, value: 'win' },
    { id: 18, value: 'win' }
  ]

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
      return '<a href=\'profile?user=' + friend.name + '\'>' + friend.name + '</a>'
    })
    if (this.friends.length === 0) {
      this.friends.push('You don\'t have any friends')
    }

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
