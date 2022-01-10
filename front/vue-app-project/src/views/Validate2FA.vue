<template>
  <div class="validate2fa-container">
    <label for="twofacode">Enter the code on your authenticator :</label><br>
    <input for="twofacode" type="text" v-model="code" /><br>
    <button @click="validateCode">Validate</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store from '../store'
import router from '../router'

@Component
export default class Validate2FA extends Vue {
  code = ''

  beforeCreate () : void {
    if (!this.$route.query.userId) {
      router.push('/login')
    }
  }

  async validateCode () : Promise<void> {
    const response = await fetch('http://localhost:4000/user/validate2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        code: this.code
      })
    })
    if (!response.ok) {
      store.commit('setPopupMessage', 'Code is invalid or expired')
      this.code = ''
      return
    }
    const data = await response.json()
    store.commit('setToken', { token: data.token, expiresIn: data.expiresIn })
    store.commit('setLogged', true)
    store.commit('setUsername', data.name)
    store.commit('setUserId', data.id)
    router.push('/')
  }

  get userId () : string {
    return this.$route.query.userId.toString()
  }
}
</script>

<style lang="scss" scoped>
  .error-text {
    text-align: center;
    color: red;
  }
</style>
