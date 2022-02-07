<template>
  <header style="position: sticky; top: 1px; z-index: 2;">
    <div class="md-layout">
      <md-toolbar class="md-dense" style="background: white;">
        <md-icon :md-src="require('../assets/42logo.svg')" class="md-small md-small-hide" />
        <span class="md-title md-small-hide" style="flex: 1">ft_transcendence</span>
        <span class="md-title md-small-show" style="flex: 1"></span>
          <div id="nav" style="display: flex; justify-content: space-between;">
            <md-button class="navbar-button" to="/" exact><md-icon class="navbar-icon">home</md-icon>Home</md-button>
            <md-button v-if="isLogged" to="/play"><md-icon class="navbar-icon">sports_tennis</md-icon>Play</md-button>
            <md-button v-if="isLogged" class="navbar-button" to="/leaderboard"><md-icon class="navbar-icon">leaderboard</md-icon>Leaderboard</md-button>
            <md-button to="/about"><md-icon class="navbar-icon">help</md-icon>About</md-button>
            <md-button v-if="!isLogged" class="navbar-button" to="/login"><md-icon class="navbar-icon">login</md-icon>Login</md-button>
          </div>
        <md-menu md-size="auto">
          <md-avatar md-menu-trigger>
            <img class="avatar" :src="avatar" alt="Avatar">
            <md-tooltip v-if="this.username.length !== 0" md-direction="left">{{ this.username }}</md-tooltip>
          </md-avatar>

          <md-menu-content>
            <md-menu-item v-if="isLogged" to="/profile">
              <md-icon>person</md-icon>
              <span>Profile</span>
            </md-menu-item>

            <md-menu-item v-if="isLogged" to="/settings">
              <md-icon>settings</md-icon>
              <span>Settings</span>
            </md-menu-item>

            <md-menu-item v-if="isLogged" @click="logout">
              <md-icon>logout</md-icon>
              <span>Logout</span>
            </md-menu-item>

            <md-menu-item v-else to="/login)">
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
import store, { globalFunctions } from '../store'
import router from '../router'
import { mapGetters } from 'vuex'
import { Watch, Prop } from 'vue-property-decorator'

@Component({
  computed: { ...mapGetters(['username']) }
})
export default class AppHeader extends Vue {

  @Prop() isLogged!: boolean;

  created() {
    console.log(this.isLogged)
  }

  public get avatar() {
    return 'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/avatar/' + store.state.userId + '?' + store.state.avatarUpdate
  }

  public logout () : void {
    store.commit('logout')
    store.commit('expireToken')
    router.push('/').catch(() => { Function.prototype() })
  }

  public get avatarUpdate () : number {
    return store.state.avatarUpdate
  }

  /* @Watch('avatarUpdate')
  public onAvatarUpdate (value: string, newValue: string) : void {
    this.avatar = this.avatar.replace(/\?.*/ /* , '') + '?' + newValue
  } */
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

.navbar-icon {
  margin-right: 5px;
  opacity: 0.65;
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
