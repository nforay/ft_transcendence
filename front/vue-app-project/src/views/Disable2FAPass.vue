<template>
  <div class="disable2fapass-container">
    <div v-if="this.errors.length !== 0">
      <b class="error-text">Please correct the following errors:</b>
      <li class="error-text" v-for="error in this.errors" :key="error">{{ error }}</li>
    </div>
    <label for="password">Enter your password:</label>
    <input for="password" type="password" v-model="password">
    <button @click="sendPassword">Submit</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'
import store from '../store'

@Component
export default class Disable2FAPass extends Vue {
  password = ''
  errors: string[] = []

  async sendPassword () {
    console.log(store.state.userId)
    if (this.password.length === 0) {
      this.errors.push('Password is required')
      return
    }
    const response = await fetch('http://localhost:4000/user/disable2fapass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: store.state.userId,
        password: this.password
      })
    })
    if (!response.ok) {
      this.password = ''
      this.errors.length = 0
      this.errors.push('Invalid password')
      return
    }
    router.push('/disable2fa')
  }
}
</script>

<style lang="scss" scoped>
  .error-text {
    text-align: center;
    color: red;
  }
</style>
