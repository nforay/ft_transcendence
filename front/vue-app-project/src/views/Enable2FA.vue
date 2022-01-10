<template>
  <div class="enable2fa-content">
    <img width="300px" :src="qrCodeData"><br>
    <label for="2fa">Enter your code:</label>
    <input for="2fa" type="text" v-model="twoFACode">
    <button @click="send2FACode">Submit</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'
import store, { globalFunctions } from '../store'

@Component
export default class Enable2FA extends Vue {
  qrData = ''
  twoFACode = ''

  async beforeCreate () : Promise<void> {
    const token = globalFunctions.getToken()
    if (token === 'error') {
      router.push('/login')
      return
    }
    const response = await fetch('http://localhost:4000/user/qr2fa', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      router.push('/settings')
      return
    }
    const data = await response.text()
    this.qrData = data
  }

  public get qrCodeData () : string {
    return this.qrData
  }

  public async send2FACode () : void {
    const body = JSON.stringify({
      userId: store.state.userId,
      code: this.twoFACode
    })
    const response = await fetch('http://localhost:4000/user/send2facode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    })
    if (!response.ok) {
      this.twoFACode = ''
      store.commit('setPopupMessage', response.statusText)
      return
    }
    router.push('/')
  }
}
</script>

<style lang="scss" scoped>
  .error-text {
    text-align: center;
    color: red;
  }
</style>
