<template>
  <div id="app">
    <app-header />
    <div style="height: calc(100vh - 49px);" class="md-layout">
      <div class="md-layout-item md-gutter">
        <router-view/>
      </div>
      <div style="background-color: #fff; box-shadow: 0 3px 1px -2px rgb(0 0 0 / 20%), 0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%);" class="md-layout-item md-size-20 md-medium-hide"  v-if="this.isLogged">
        <Chat />
      </div>
    </div>
    <md-snackbar :md-active.sync="showSnack" >{{ this.recordedPopupMessage }}</md-snackbar>
  </div>
</template>

<script lang="ts">
import AppHeader from './components/AppHeader.vue'
import Chat from './components/Chat.vue'
import { mapGetters } from 'vuex'
import store, { globalFunctions } from './store'
import { Component, Watch } from 'vue-property-decorator'
import Vue from 'vue'


@Component({
  components: {
    AppHeader,
    Chat
  },
  computed: {
    ...mapGetters(['isLogged']),
  },
})
export default class App extends Vue {
  showSnack = false
  recordedPopupMessage = ''

  get popupMessage () {
    return store.state.popupMessage
  }

  @Watch('popupMessage')
  onPopupMessageChange(val: string) {
    if (val.length > 0) {
      this.showSnack = true
      this.recordedPopupMessage = val
      setTimeout(() => {
        this.showSnack = false
        this.recordedPopupMessage = ''
      }, 5000)
      store.commit('setPopupMessage', '')
    }
  }

  async created() {
    if (globalFunctions.getToken() !== 'error') {
      await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/updateOnlineStatus`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      })
    }

    setInterval(async function () {
      if (globalFunctions.getToken() === 'error') {
        return
      }
      await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/updateOnlineStatus`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      })
    }, 25000)
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
