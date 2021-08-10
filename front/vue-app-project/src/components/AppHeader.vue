<template>
  <header>
    <md-toolbar>
      <md-icon md-src="assets/42logo.svg" />
      <h3 class="md-title" style="flex: 1">ft_transcendence</h3>
      <md-menu md-size="medium">
        <md-badge v-if="this.notificationsCount > 0" class="md-primary" :md-content="this.notificationsCount" md-menu-trigger>
          <md-avatar>
            <img class="avatar" src="../assets/avatar.jpg" alt="Avatar">
            <md-tooltip v-if="this.username.length !== 0" md-direction="left">{{ this.username }}</md-tooltip>
          </md-avatar>
        </md-badge>
        <md-avatar v-else md-menu-trigger>
          <img class="avatar" src="../assets/avatar.jpg" alt="Avatar">
          <md-tooltip v-if="this.username.length !== 0" md-direction="left">{{ this.username }}</md-tooltip>
        </md-avatar>

        <md-menu-content>
          <md-menu-item v-if="this.isLogged">
            <md-icon>notifications</md-icon>
            <span>Notifications</span>
          </md-menu-item>

          <md-menu-item v-if="this.isLogged" @click="redirectToSettings()">
            <md-icon>settings</md-icon>
            <span>Settings</span>
          </md-menu-item>

          <md-menu-item v-if="this.isLogged" @click="logout">
            <md-icon>logout</md-icon>
            <span>Logout</span>
          </md-menu-item>

          <md-menu-item v-else @click="redirectToLogin()">
            <md-icon>login</md-icon>
            <span>Log In</span>
          </md-menu-item>

        </md-menu-content>
      </md-menu>
    </md-toolbar>
  </header>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store from '@/store'
import router from '@/router'

@Component
export default class AppHeader extends Vue {
  public logout () : void {
    store.commit('logout')
    document.cookie = 'Token=; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
  }

  public get username () : string {
    return store.state.username
  }

  public get isLogged () : boolean {
    return store.state.isLogged
  }

  public get notificationsCount () : number {
    return store.state.notifications.length
  }

  public redirectToSettings () : void {
    router.push('/settings')
  }

  public redirectToLogin () : void {
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.md-menu-item {
    margin: 12px;
}
.avatar {
  vertical-align: middle;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.md-toolbar + .md-toolbar {
    margin-top: 16px;
  }
</style>
