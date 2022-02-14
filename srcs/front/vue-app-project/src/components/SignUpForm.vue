<template>
  <div class="md-layout-item">
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
  public sending = false

  checkForm () : boolean {
    if (this.username.length === 0) {
      store.commit('setPopupMessage', 'Username cannot be empty')
      return false
    }

    if (this.password.length === 0) {
      store.commit('setPopupMessage', 'Password cannot be empty')
      return false
    }

    if (this.confirmPassword !== this.password) {
      store.commit('setPopupMessage', 'Passwords doesn\'t match')
      return false
    }

    return true
  }

  async signup () : Promise<void> {
    if (!this.checkForm()) {
      return
    }
    this.sending = true
    const response = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/`, {
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
      store.commit('setPopupMessage', 'Cannot create user')
    } else {
      const data = await response.json()
      store.commit('setToken', { token: data.token, expiresIn: data.expiresIn })
      store.commit('setLogged', true)
      store.commit('setUsername', data.name)
      store.commit('setUserId', data.id)
      store.commit('setRole', data.role)
      router.push('/').catch(() => { Function.prototype() })
    }
  }
}
</script>

<style lang="scss" scoped>
  .md-card {
    margin-top: 16px;
  }

  .md-field:last-child {
    margin-bottom: 20px;
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
