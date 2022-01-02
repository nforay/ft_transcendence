<template>
  <div class="login-form-content">
    <div v-if="this.errors.length !== 0">
      <b class="error-text">Please correct the following errors:</b>
      <li class="error-text" v-for="error in this.errors" :key="error">{{ error }}</li>
    </div>
    <br/>
      <md-field>
        <label for="username">Username</label>
        <md-input v-model="initial" id="login-username"></md-input>
      </md-field>
      <md-field>
        <label for="password">Password</label>
        <md-input id="login-password" v-model="password" type="password"></md-input>
      </md-field>
      <md-button class="md-raised md-primary" @click="login">Log In</md-button>
  </div>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import store from '@/store'
import router from '@/router'

@Component
export default class LoginForm extends Vue {
  public username = ''
  public password = ''

  public errors : string[] = []

  checkForm () : boolean {
    this.errors = []

    if (this.username.length === 0) {
      this.errors.push('Username cannot be empty')
    }

    if (this.password.length === 0) {
      this.errors.push('Password cannot be empty')
    }

    return this.errors.length === 0
  }

  async login () : Promise<void> {
    if (!this.checkForm()) {
      return
    }

    const response = await fetch('http://localhost:4000/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: this.username,
        password: this.password
      })
    })

    if (!response.ok) {
      const data = await response.json()
      store.commit('expireToken')
      store.commit('setLogged', false)
      this.errors.push(data.message)
    } else {
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
}
</script>

<style scoped>

  .md-field:last-child {
    margin-bottom: 40px;
  }

  .error-text {
    text-align: left;
    color: red;
  }
</style>
