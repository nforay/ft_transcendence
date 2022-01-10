<template>
  <header>
    <div class="md-layout">
      <md-toolbar class="md-dense" style="background: white;">
        <md-icon :md-src="require('../assets/42logo.svg')" class="md-small md-small-hide" /><span class="md-title md-small-hide" style="flex: 1">ft_transcendence</span>
        <div id="nav" style="flex: 2">
        <md-tabs md-sync-route md-alignment="right">
          <md-tab id="tab-home" md-label="Home" to="/" exact></md-tab>
          <md-tab id="tab-play" md-label="Play" to="/play"></md-tab>
          <md-tab id="tab-about" md-label="About" to="/about"></md-tab>
          <md-tab id="tab-login" md-label="Login" to="/login"></md-tab>
          <md-tab id="tab-chat" md-label="Chat" to="/chat"></md-tab>
        </md-tabs>
      </div>
        <md-menu md-size="auto" class="md-xsmall-hide">
          <md-avatar md-menu-trigger>
            <img class="avatar" :src="avatar" alt="Avatar">
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
    </div>
  </header>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store from '@/store'
import router from '@/router'
import { mapGetters } from 'vuex'

@Component({
  computed: mapGetters(['username', 'isLogged', 'notificationsCount', 'avatar'])
})
export default class AppHeader extends Vue {
  public logout () : void {
    store.commit('logout')
    store.commit('expireToken')
    router.push('/')
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

.md-layout-item {
  height: 40px;
  &:after {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.avatar {
  vertical-align: middle;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.avatar:hover {
  cursor: pointer;
}

.md-toolbar + .md-toolbar {
    margin-top: 16px;
}
</style>
