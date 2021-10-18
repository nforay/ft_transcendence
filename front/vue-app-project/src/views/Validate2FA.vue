<template>
  <div class="validate2fa-container">
    <div v-if="this.errors.length !== 0">
      <b class="error-text">Please correct the following errors:</b>
      <li class="error-text" v-for="error in this.errors" :key="error">{{ error }}</li>
    </div>
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
  errors: string[] = []

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
      this.errors.length = 0
      this.errors.push('Code is invalid or expired')
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
