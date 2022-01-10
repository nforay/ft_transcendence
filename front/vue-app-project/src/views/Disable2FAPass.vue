<template>
  <div class="disable2fapass-container">
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
    if (this.password.length === 0) {
      store.commit('setPopupMessage', 'Password is required')
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
      store.commit('setPopupMessage', 'Invalid password')
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
