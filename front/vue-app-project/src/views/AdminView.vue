<template>
  <div>
    <div v-if="this.isadmin">
      <div class="md-layout">
        <div class="md-layout-item" style="margin: 20px 10px 0px 20px;">
            <span class="md-title">Users list<md-button class="md-icon-button md-dense" @click="refreshUsers()"><md-icon>refresh</md-icon></md-button></span>
            <md-table style="max-height: 50vh;" md-card>
              <md-table-row>
                <md-table-head class="md-xsmall-hide" style="position: relative; width: 50px;">Avatar</md-table-head>
                <md-table-head>Name</md-table-head>
                <md-table-head>Actions</md-table-head>
              </md-table-row>
              <md-table-row style="cursor: pointer;" v-for="(user, i) in users" :key="i">
                <md-table-cell style="width: 0;" class="md-xsmall-hide">
                  <div style="position: relative; width: 50px;">
                    <img class="user-avatar" :src="user.avatar">
                  </div>
                </md-table-cell>
                <md-table-cell style="width: 0;">{{ user.username }}</md-table-cell>
                <md-table-cell>
                  <md-button v-if="user.role !== 'admin'" class="md-primary" @click="opuser(user.id)"><md-icon>supervised_user_circle</md-icon>Promote</md-button>
                  <md-button v-else class="md-accent" @click="opuser(user.id)"><md-icon>account_circle</md-icon>Demote</md-button>
                </md-table-cell>
              </md-table-row>
            </md-table>
          </div>
          <div class="md-layout-item" style="margin: 20px 20px 0px 10px;">
          <span class="md-title">Channels list<md-button class="md-icon-button md-dense" @click="refreshChans()"><md-icon>refresh</md-icon></md-button></span>
            <md-table style="max-height: 50vh;" md-card>
              <md-table-row>
                <md-table-head>Name</md-table-head>
                <md-table-head>Actions</md-table-head>
              </md-table-row>
              <md-table-row style="cursor: pointer;" v-for="(chan, i) in chans" :key="i">
                <md-table-cell style="width: 0;">{{ chan }}</md-table-cell>
                <md-table-cell>
                  <md-button class="md-accent" @click="deletechan(chan)" :disabled="chan === 'general'"><md-icon>delete</md-icon>Delete</md-button>
                </md-table-cell>
              </md-table-row>
            </md-table>
          </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store, { globalFunctions } from '../store'
import router from '../router'

@Component
export default class AdminView extends Vue {
  public users: any[] = []
  public chans: string[] = []

  public isadmin = false
  public adminusername = ''

  async mounted (): Promise<void> {
    while (!store.state.requestedLogin) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    if (globalFunctions.getToken() === 'error') {
      router.push('/').catch(() => { Function.prototype() })
      return
    }

    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/' + store.state.userId, {
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
      router.push('/').catch(() => { Function.prototype() })
      return
    }

    const usersResponse = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/', {
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
        id: user.id,
        role: user.role
      }
    })
    if (this.users.length === 0) {
      this.users.push('No user is registered')
    }
    this.users.sort((a, b) => { return (a.username < b.username ? -1 : 1)})

    const chansResponse = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/chan/', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
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
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/', {
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
        id: user.id,
        role: user.role
      }
    })
    if (this.users.length === 0) {
      this.users.push('No user is registered')
    }
    this.users.sort((a, b) => { return (a.username < b.username ? -1 : 1)})
  }

  async refreshChans (): Promise<void> {
    const chansResponse = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/chan/', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
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
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/chan/' + chan, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      }
    )
    if (chanResponse.ok) {
      await this.refreshChans()
    }
  }

  async opuser (id: string): Promise<void> {
    const userResponse = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/admin/' + id, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      }
    )
    if (userResponse.ok) {
      await this.refreshUsers()
    }
  }
}
</script>

<style scoped>
.user-avatar {
  max-width: 50px;
}

img.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 5%;
  object-fit: cover;
}
</style>
