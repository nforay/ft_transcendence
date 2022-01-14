<template>
  <div>
    <div v-if="this.isadmin">
      <h1>Admin View</h1>
      <div id="container">
        <div id="first">
          <h2>Users List:</h2>
          <span style="color: green;" @click="refreshUsers()">refresh</span>
          <div id="scrollbox" style="display: flex">
            <span v-for="(user, i) in users" :key="i">
              <a :href="user.url">
                <div style="position: relative;">
                  <img class="user-avatar" :src="user.avatar">
                  <div :class="user.htmlStatusClasses" :src="user.statusImage"></div>
                </div>
                <a> {{ user.username }} </a>
              </a>
              <span v-if="user.username !== adminusername" style="color: red;" @click="deleteuser(user.id)">x</span>
            </span>
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
  public chans: string[] = []

  public isadmin = false
  public adminusername = ''

  async mounted (): Promise<void> {
    while (!store.state.requestedLogin) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    const token = globalFunctions.getToken()
    if (token === 'error') {
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
    if (data.role === 'admin') {
      this.isadmin = true
      this.adminusername = data.name
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
        htmlStatusClasses: 'status-icon status-' + user.status,
        id: user.id
      }
    })
    if (this.users.length === 0) {
      this.users.push('No user is registered')
    }

    const chansResponse = await fetch(
      'http://localhost:4000/chan/', {
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
        htmlStatusClasses: 'status-icon status-' + user.status,
        id: user.id
      }
    })
    if (this.users.length === 0) {
      this.users.push('No user is registered')
    }
  }

  async refreshChans (): Promise<void> {
    const chansResponse = await fetch(
      'http://localhost:4000/chan/', {
        method: 'GET'
      }
    )
    if (!chansResponse.ok) {
      return
    }
    const chansData = await chansResponse.json()
    this.chans = chansData.chans
  }

  async deletechan (chan: string): Promise<void> {
    const chanResponse = await fetch(
      'http://localhost:4000/chan/' + this.adminusername + chan, {
        method: 'DELETE'
      }
    )
    if (chanResponse.ok) {
      await this.refreshChans()
    }
  }

  async deleteuser (id: string): Promise<void> {
    console.log('DELETE ' + id)
    const userResponse = await fetch(
      'http://localhost:4000/user/' + id, {
        method: 'DELETE'
      }
    )
    if (userResponse.ok) {
      await this.refreshUsers()
    }
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
