<template>
  <div class="enable2fa-content">
    <div class="md-layout md-gutter">
      <div style="margin: 15px 0;" class="md-layout-item md-layout md-gutter md-alignment-top-center">
        <md-card style="min-width: 300px;" class="md-layout-item md-size-65">
          <md-card-header>
            <span class="md-title">Enable 2FA</span>
          </md-card-header>
          
          <div class="md-layout md-size-100">
            <md-card-content class="md-layout md-layout-item md-alignment-center-center">
              <div class="md-layout-item md-alignment-center-center md-size-35">
                <img width="100%" :src="qrCodeData">
                <md-field md-clearable>
                  <label>Your code</label>
                  <md-input for="2fa" type="text" v-model="twoFACode"></md-input>
                </md-field>
              </div>
            </md-card-content>
          </div>
          <md-card-actions>
            <md-button class="md-primary" @click="send2FACode">Submit <md-icon>send</md-icon></md-button>
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
export default class Enable2FA extends Vue {
  qrData = ''
  twoFACode = ''

  async beforeCreate () : Promise<void> {
    const token = globalFunctions.getToken()
    if (token === 'error') {
      router.push('/login').catch(() => { Function.prototype() })
      return
    }
    const response = await fetch(`${process.env.VUE_APP_URL}:${process.env.VUE_APP_NEST_PORT}/user/qr2fa`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      router.push('/settings').catch(() => { Function.prototype() })
      return
    }
    const data = await response.text()
    this.qrData = data
  }

  public get qrCodeData () : string {
    return this.qrData
  }

  public async send2FACode () : Promise<void> {
    const body = JSON.stringify({
      userId: store.state.userId,
      code: this.twoFACode
    })
    const response = await fetch(`${process.env.VUE_APP_URL}:${process.env.VUE_APP_NEST_PORT}/user/send2facode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    })
    if (!response.ok) {
      this.twoFACode = ''
      store.commit('setPopupMessage', response.statusText)
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
