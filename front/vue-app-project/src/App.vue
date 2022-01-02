<template>
  <div id="app">
    <app-header />
    <Chat v-if="this.isLogged" />
    <div id="nav">
      <md-button to="/">Home</md-button>
      <md-button to="/play">Play</md-button>
      <md-button to="/about">About</md-button>
      <md-button to="/login">Login</md-button>
      <md-button to="/chat">Chat</md-button>
    </div>
    <router-view/>
  </div>
</template>

<script lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import Chat from './components/Chat.vue'
import { mapGetters } from 'vuex'

export default {
  components: {
    AppHeader,
    Chat
  },
  computed: { ...mapGetters(['isLogged']) }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
