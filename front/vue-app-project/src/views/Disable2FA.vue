<template>
  <div class="disable2fa-container">
    <label for="2fa">Enter the code on your authenticator:</label>
    <input for="2fa" type="text" v-model="code">
    <button @click="sendCode">Submit</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'
import store from '../store'

@Component
export default class Disable2FA extends Vue {
  code = ''
  errors: string[] = []

  async sendCode () {
    const response = await fetch('http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/disable2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: store.state.userId,
        code: this.code
      })
    })
    if (!response.ok) {
      this.code = ''
      store.commit('setPopupMessage', 'Code is invalid or expired')
      return
    }
    router.push('/').catch(() => { Function.prototype() })
  }
}
</script>

<style lang="scss" scoped>
  .error-text {
    text-align: center;
    color: red;
  }
</style>
