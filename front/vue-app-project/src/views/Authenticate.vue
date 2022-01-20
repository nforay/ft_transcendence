<template>
  <div id="authenticate">
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import router from '../router'
import store from '../store'
import Component from 'vue-class-component'

@Component
export default class Authenticate extends Vue {
  async mounted () : Promise<void> {
    if (!this.$route.query.code) {
      router.push('/login')
      return
    }
    const response = await fetch(`http://localhost:4000/user/authenticate?code=${this.$route.query.code.toString()}`, {
      method: 'POST'
    })
    if (!response.ok) {
      store.commit('setPopupMessage', 'Authentication failed: ' + response.statusText)
      router.push('/login')
      return
    }
    const data = await response.json()
    if (data.has2FA) {
      store.commit('expireToken')
      store.commit('setLogged', false)
      router.push('/validate2fa?userId=' + data.id)
    } else {
      store.commit('setToken', { token: data.token, expiresIn: data.expiresIn })
      store.commit('setLogged', true)
      store.commit('setUsername', data.name)
      store.commit('setUserId', data.id)
      router.push('/')
    }
  }
}
</script>
