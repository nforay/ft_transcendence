<template>
  <div id="app">
    <app-header />
    <Chat v-if="this.isLogged" />
    <router-view/>
    <md-snackbar :md-active.sync="showSnack" >{{ this.recordedPopupMessage }}</md-snackbar>
  </div>
</template>

<script lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import Chat from './components/Chat.vue'
import { mapGetters } from 'vuex'
import store from '@/store'

export default {
  data () {
    return { showSnack: false, recordedPopupMessage: '' }
  },
  components: {
    AppHeader,
    Chat
  },
  computed: {
    ...mapGetters(['isLogged']),
    popupMessage () {
      return store.state.popupMessage
    }
  },
  watch: {
    popupMessage: function (val) {
      if (val.length > 0) {
        this.showSnack = true
        this.recordedPopupMessage = val
        setTimeout(function () {
          this.showSnack = false
          this.recordedPopupMessage = ''
        }, 100)
        store.commit('setPopupMessage', '')
      }
    }
  }
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
