<template>
  <div>
    <form novalidate class="md-layout">
      <md-card class="md-layout-item md-size-100 md-small-size-100">
        <md-card-header>
          <div class="md-title">Sign Up</div>
        </md-card-header>
        <md-card-content>
          <br/>
          <div class="md-layout md-gutter">
            <div class="md-layout-item md-small-size-100">
              <md-field>
                <label for="username">Username</label>
                <md-input class="username" v-model="username" id="signup-username" ref="username"></md-input>
              </md-field>
              <md-field>
                <label for="password">Password</label>
                <md-input id="signup-password" v-model="password" type="password"></md-input>
              </md-field>
              <md-field>
                <label for="password">Confirm Password</label>
                <md-input id="signup-confirm-password" v-model="confirmPassword" type="password"></md-input>
              </md-field>
            </div>
          </div>
        </md-card-content>
        <md-card-actions>
          <md-button @click="signup" class="md-primary" :disabled="sending">Sign Up</md-button>
        </md-card-actions>
        <md-progress-bar md-mode="indeterminate" v-if="sending" />
      </md-card>
      </form>
      <md-snackbar :md-active.sync="showSnack" >{{ this.errors[0] }}</md-snackbar>
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

    if (this.confirmPassword !== this.password) {
      this.errors.push('Passwords doesn\'t match')
    }

    return this.errors.length === 0
  }

  async signup () : Promise<void> {
    this.showSnack = false
    this.showSnack = !this.checkForm()
    if (this.showSnack) {
      return
    }
    this.sending = true
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
      this.sending = false
      store.commit('logout')
      router.push('/login')
      this.errors.push('Cannot create user')
      this.showSnack = true
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

  .md-progress-bar {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
  }
</style>
