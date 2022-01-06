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
          <md-button @click="login" class="md-raised md-primary" :disabled="sending">Log in</md-button>
        </md-card-actions>
        <md-progress-bar md-mode="indeterminate" v-if="sending" />
      </md-card>
    <md-snackbar :md-active.sync="showSnack" >{{ this.errors[0] }}</md-snackbar>
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
  public showSnack = false
  public sending = false

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
    this.showSnack = false
    this.showSnack = !this.checkForm()
    if (this.showSnack) {
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
      this.errors.push('Incorrect username or password')
      this.showSnack = true
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
