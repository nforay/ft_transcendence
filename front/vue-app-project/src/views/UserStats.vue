<template>
  <div>
    <div class="user-profile-content">
      <div class="user-avatar-content">
        <img class="avatar" :src="avatar" alt="Avatar">
      </div>
      <div class="username">
        <h1>{{ this.username }}</h1>
        <p class="bio">{{ this.bio }}</p>
      </div>
    </div>
    <div>
      <h2>elo = {{ this.elo }}</h2>
      <h2>Match History:</h2>
      <ul v-for="res in history" :key="res.id">{{ res.value }}</ul>
    </div>
    <div v-if="thisuser === true">
      <h2>Friend list:</h2>
      <ul v-for="friend in friends" :key="friend.id">{{ friend.value }}</ul>
    </div>
    <div v-else-if="isfriend === true">
      <h2 v-on:click="rmFriend()">Remove friend</h2>
    </div>
    <div v-else>
      <h2 v-on:click="addFriend()">Add Friend</h2>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { store, globalFunctions } from '@/store'
import router from '@/router'

class ListVue {
  id: number
  value: string
}

@Component
export default class UserProfile extends Vue {
  public username = ''
  public bio = ''
  public avatar = ''
  public elo = 1200
  public history: ListVue[] = [{ id: 0, value: 'win' }, { id: 1, value: 'lose' }, { id: 2, value: 'lose' }]
  public friends: ListVue[] = []

  public thisuser = false
  public isfriend = false

  constructor () {
    super()
    this.username = 'Username'
    this.bio = 'No bio written'
    this.avatar = ''
    this.thisuser = false
  }

  async beforeCreate () : Promise<void> {
    const token = globalFunctions.getToken()
    if (token === 'error') {
      router.push('/login')
    }
  }

  async mounted () : Promise<void> {
    if (!this.$route.query.user) {
      if (store.state.userId !== '') {
        this.thisuser = true
        const response = await fetch('http://localhost:4000/user/' + store.state.userId, {
          method: 'GET'
        })
        if (response.ok) {
          const data = await response.json()
          this.username = data.name
          this.bio = data.bio
          this.avatar = data.avatar
          const resp = await fetch('http://localhost:4000/user/friends/' + store.state.userId, {
            method: 'GET'
          })
          console.log('resp.ok = ' + resp.ok)
          if (resp.ok) {
            const data = await resp.json()
            if (data === '' || data === null || data.length === 0) {
              this.friends.push({
                id: 0,
                value: 'You don\'t have any friends'
              })
            } else {
              for (let index = 0; index < data.length; index++) {
                this.friends.push({
                  id: index,
                  value: data[index]
                })
              }
            }
          } else {
            this.friends.push({
              id: 0,
              value: 'You don\'t have any friends'
            })
          }
        }
      }
    } else {
      const response = await fetch('http://localhost:4000/user/username/' + this.$route.query.user, {
        method: 'GET'
      })
      if (response.ok) {
        const data = await response.json()
        this.username = data.name
        this.bio = data.bio
        this.avatar = data.avatar
        if (store.state.userId !== '') {
          const resp = await fetch('http://localhost:4000/user/friends/check/' + store.state.userId + '/' + this.$route.query.user, {
            method: 'GET'
          })
          if (resp.ok) {
            const dat = await resp.json()
            this.isfriend = dat
          }
        }
      }
    }
  }

  async addFriend () : Promise<void> {
    if (!this.$route.query.user || store.state.userId === '') {
      return
    }
    console.log('Add friend')
    const response = await fetch('http://localhost:4000/user/friends/' + store.state.userId + '/' + this.$route.query.user, {
      method: 'Post'
    })
    if (response.ok) {
      this.isfriend = true
    }
  }

  async rmFriend () : Promise<void> {
    if (!this.$route.query.user || store.state.userId === '') {
      return
    }
    console.log('Remove friend')
    const response = await fetch('http://localhost:4000/user/friends/' + store.state.userId + '/' + this.$route.query.user, {
      method: 'Delete'
    })
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
</style>
