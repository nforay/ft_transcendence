<template>
  <div>
    <div v-if="this.isadmin">
      <h1>Admin View</h1>
      <h2>User List:</h2>
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

  public isadmin = false

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
    console.log('data.role = ' + data.role)
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
</style>
