<template>
  <div style="position: relative; margin: 15px;">
    <div class="md-layout md-gutter md-alignment-center-center">
      <div class="md-layout-item md-gutter md-layout md-size-50">
        <md-card class="md-layout-item md-gutter">
          <md-card-header>
            <span class="md-title">Disable 2FA</span>
          </md-card-header>
          
          <div class="md-layout">
            <md-card-content class="md-layout md-layout-item">
              <div class="md-layout-item">
                <md-field md-clearable>
                  <label>Your authenticator's code</label>
                  <md-input for="2fa" type="text" v-model="code"></md-input>
                </md-field>
              </div>
            </md-card-content>
          </div>
          <md-card-actions>
            <md-button class="md-primary" @click="sendCode">Submit <md-icon>send</md-icon></md-button>
          </md-card-actions>
        </md-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'
import store, { globalFunctions } from '../store'

@Component
export default class Disable2FA extends Vue {
  code = ''
  errors: string[] = []

  async beforeCreate () : Promise<void> {
    const token = globalFunctions.getToken()
    if (token === 'error') {
      router.push('/login').catch(() => { Function.prototype() })
      return
    }
  }

  async sendCode () {
    const response = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/disable2fa`, {
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
      store.commit('setPopupMessage', 'Code is invalid or expired')
      return
    }
    router.push('/').catch(() => { Function.prototype() })
  }
}
</script>

<style lang="scss" scoped>
  .error-text {
    text-align: center;
    color: red;
  }
</style>
