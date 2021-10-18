<template>
  <div class="disable2fa-container">
    <div v-if="this.errors.length !== 0">
      <b class="error-text">Please correct the following errors:</b>
      <li class="error-text" v-for="error in this.errors" :key="error">{{ error }}</li>
    </div>
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
    const response = await fetch('http://localhost:4000/user/disable2fa', {
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
      this.errors.length = 0
      this.errors.push('Code is invalid or expired')
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
