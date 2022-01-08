<template>
  <div id="app">
    <app-header />
    <Chat v-if="this.isLogged" />
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
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
