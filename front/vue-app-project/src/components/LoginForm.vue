<template>
  <div class="md-layout-item">
    <md-card class="md-layout-item md-size-100 md-small-size-100">
        <md-card-header>
          <div class="md-title">Log in</div>
        </md-card-header>
        <md-card-content>
    <br/>
      <md-field>
        <label for="username">Username</label>
        <md-input v-model="username" id="login-username"></md-input>
      </md-field>
      <md-field>
        <label for="password">Password</label>
        <md-input id="login-password" v-model="password" type="password"></md-input>
      </md-field>
        </md-card-content>
        <md-card-actions>
          <md-button @click="loginwith42" class="md-raised" :disabled="sending">Login With <img src="../assets/42logo.svg" height="24" width="24"/></md-button>
          <md-button @click="login" class="md-raised md-primary" :disabled="sending">Log in</md-button>
        </md-card-actions>
        <md-progress-bar md-mode="indeterminate" v-if="sending" />
      </md-card>
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
  public sending = false

  public errors : string[] = []

  checkForm () : boolean {
    if (this.username.length === 0) {
      store.commit('setPopupMessage', 'Username cannot be empty')
      return false
    }

    if (this.password.length === 0) {
      store.commit('setPopupMessage', 'Password cannot be empty')
      return false
    }

    return true
  }

  loginwith42 () : void {
    window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=7e4d240305d7f5de6fab4ab3b3ca9eb1a2712ca08034ca4e3d3cb699ced48145&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauthenticate&response_type=code'
  }

  async login () : Promise<void> {
    if (!this.checkForm()) {
      return
    }
    this.sending = true

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
      store.commit('setPopupMessage', 'Incorrect username or password')
      this.sending = false
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
  .md-card {
    margin-top: 16px;
  }

  .md-field:last-child {
    margin-bottom: 20px;
  }
</style>
