<template>
  <div>
    <div class="error-text" v-if="this.errors.length !== 0">
      <b class="error-text">Please correct the following errors:</b>
      <li class="error-text" v-for="error in this.errors" :key="error">{{ error }}</li>
    </div>
    <br/>
        <md-field md-clearable>
          <label for="username">Username</label>
          <md-input v-model="initial" id="signup-username"></md-input>
        </md-field>
        <md-field>
          <label for="password">Password</label>
          <md-input id="signup-password" v-model="password" type="password"></md-input>
        </md-field>
        <md-field>
          <label for="password">Confirm Password</label>
          <md-input id="signup-confirm-password" v-model="password" type="password"></md-input>
        </md-field>
      <md-button @click="signup" class="md-raised">Sign Up</md-button>
  </div>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'
import store from '@/store'
import router from '@/router'

@Component
export default class SignUpForm extends Vue {
  public username = ''
  public password = ''
  public confirmPassword = ''

  public errors : string[] = []

  checkForm () : boolean {
    this.errors = []

    if (this.username.length === 0) {
      this.errors.push('Username cannot be empty')
    }

    if (this.password.length === 0) {
      this.errors.push('Password cannot be empty')
    }

    if (this.confirmPassword !== this.password) {
      this.errors.push('Passwords doesn\'t match')
    }

    return this.errors.length === 0
  }

  async signup () : Promise<void> {
    if (!this.checkForm()) {
      return
    }

    const response = await fetch('http://localhost:4000/user/', {
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
      store.commit('logout')
      router.push('/login')
    } else {
      const data = await response.json()
      store.commit('setToken', { token: data.token, expiresIn: data.expiresIn })
      store.commit('setLogged', true)
      store.commit('setUsername', data.name)
      store.commit('setUserId', data.id)
      router.push('/')
    }
  }
}
</script>

<style lang="scss" scoped>

  .md-field:last-child {
    margin-bottom: 40px;
  }

  .error-text {
    text-align: left;
    color: red;
  }
</style>
