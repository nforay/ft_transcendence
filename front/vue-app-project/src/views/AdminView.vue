<template>
  <div>
    <div v-if="this.isadmin">
      <h1>Admin View</h1>
<<<<<<< HEAD
      <div id="container">
        <div id="first">
          <h2>Users List:</h2>
          <span style="color: green;" @click="refreshUsers()">refresh</span>
          <div id="scrollbox" style="display: flex">
            <a :href="user.url" v-for="(user, i) in users" :key="i">
              <div style="position: relative;">
                <img class="user-avatar" :src="user.avatar">
                <div :class="user.htmlStatusClasses" :src="user.statusImage"></div>
              </div>
              <a> {{ user.username }} </a>
            </a>
          </div>
        </div>
        <div id="second">
          <h2>Channels List:</h2>
          <span style="color: green;" @click="refreshChans()">refresh</span>
          <div id="scrollbox">
            <ul v-for="(chan, i) in chans" :key="i">
              {{ chan }}
              <span v-if="chan !== 'general'" style="color: red;" @click="deletechan(chan)">x</span>
            </ul>
          </div>
        </div>
        <div id="clear"></div>
=======
      <h2>User List:</h2>
      <div id="scrollbox" style="display: flex">
        <a :href="user.url" v-for="(user, i) in users" :key="i">
          <div style="position: relative;">
            <img class="user-avatar" :src="user.avatar">
            <div :class="user.htmlStatusClasses" :src="user.statusImage"></div>
          </div>
          <a> {{ user.username }} </a>
        </a>
>>>>>>> 9a455ff45813b1830a3368e21c7af0a0a7e5fdee
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
  public users: string[] = []
<<<<<<< HEAD
  public chans: string[] = []

  public isadmin = false
  private token: string
=======

  public isadmin = false
>>>>>>> 9a455ff45813b1830a3368e21c7af0a0a7e5fdee

  async mounted (): Promise<void> {
    while (!store.state.requestedLogin) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
<<<<<<< HEAD
    this.token = globalFunctions.getToken()
    if (this.token === 'error') {
=======
    const token = globalFunctions.getToken()
    if (token === 'error') {
>>>>>>> 9a455ff45813b1830a3368e21c7af0a0a7e5fdee
      router.push('/')
      return
    }

    const response = await fetch(
      'http://localhost:4000/user/' + store.state.userId, {
        method: 'GET'
      }
    )
    if (!response.ok) {
      return
    }
    const data = await response.json()
<<<<<<< HEAD
=======
    console.log('data.role = ' + data.role)
>>>>>>> 9a455ff45813b1830a3368e21c7af0a0a7e5fdee
    if (data.role === 'admin') {
      this.isadmin = true
    } else {
      router.push('/')
      return
    }

    const usersResponse = await fetch(
      'http://localhost:4000/user/', {
        method: 'GET'
      }
    )
    if (!usersResponse.ok) {
      return
    }
    const usersData = await usersResponse.json()
    this.users = usersData.map(user => {
      return {
        username: user.name,
        url: '/profile?user=' + user.name,
        avatar: user.avatar,
        htmlStatusClasses: 'status-icon status-' + user.status
      }
    })
    if (this.users.length === 0) {
      this.users.push('No user is registered')
    }

    const chansResponse = await fetch(
      'http://localhost:4000/chan/' + this.token, {
        method: 'GET'
      }
    )
    if (!chansResponse.ok) {
      return
    }
    const chansData = await chansResponse.json()
    this.chans = chansData.chans
  }

  async refreshUsers (): Promise<void> {
    const usersResponse = await fetch(
      'http://localhost:4000/user/', {
        method: 'GET'
      }
    )
    if (!usersResponse.ok) {
      return
    }
    const usersData = await usersResponse.json()
    this.users = usersData.map(user => {
      return {
        username: user.name,
        url: '/profile?user=' + user.name,
        avatar: user.avatar,
        htmlStatusClasses: 'status-icon status-' + user.status
      }
    })
    if (this.users.length === 0) {
      this.users.push('No user is registered')
    }
  }

  async refreshChans (): Promise<void> {
    const chansResponse = await fetch(
      'http://localhost:4000/chan/' + this.token, {
        method: 'GET'
      }
    )
    if (!chansResponse.ok) {
      return
    }
    const chansData = await chansResponse.json()
    this.chans = chansData.chans
  }

  async deletechan (chan: string) {
    console.log('deleting channel ' + chan)
  }
}
</script>

<style scoped>
img.user-avatar {
  display: block;
  width: 50px;
  height: 50px;
  margin: 10px 10px 10px 10px;
  border-radius: 30%;
  overflow: hidden;
}

h1 {
  font-family: "Helvetica";
  font-size: 32px;
}

h2 {
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
<<<<<<< HEAD

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
=======
>>>>>>> 9a455ff45813b1830a3368e21c7af0a0a7e5fdee
</style>
