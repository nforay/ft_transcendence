<template>
  <div id="app">
    <app-header />
    <div style="height: calc(100vh - 49px);" class="md-layout" v-if="this.isLogged">
      <div class="md-layout-item md-gutter">
        <router-view/>
      </div>
      <div style="background-color: #fff; box-shadow: 0 3px 1px -2px rgb(0 0 0 / 20%), 0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%);" class="md-layout-item md-size-20 md-medium-hide">
        <Chat />
      </div>
    </div>
    <router-view v-else />
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
  overflow-x: hidden;
}
</style>
