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
      <ul v-for="res in history" :key="res">{{ res }}</ul>
    </div>
    <div v-if="thisuser == true">
      <h2>Friend list:</h2>
      <ul v-for="friend in friends" :key="friend">{{ friend }}</ul>
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
  public elo = 1200
  public history = ['win', 'lose', 'lose', 'win', 'win']
  public friends = ['aaa', 'bbb', 'ccc']

  public thisuser: boolean

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
        console.log('store.state.userId = ' + store.state.userId)
        const response = await fetch('http://localhost:4000/user/' + store.state.userId, {
          method: 'GET'
        })
        if (response.ok) {
          const data = await response.json()
          this.username = data.name
          this.bio = data.bio
          this.avatar = data.avatar
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
      }
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
