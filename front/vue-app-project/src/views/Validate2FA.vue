<template>
  <div class="validate2fa-container" style="position: relative; margin: 15px;">
    <div class="md-layout md-gutter md-alignment-center-center">
      <div class="md-layout-item md-gutter md-layout md-size-50">
        <md-card class="md-layout-item md-gutter">
          <md-card-header>
            <span class="md-title">Validate 2FA</span>
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
            <md-button class="md-primary" @click="validateCode">Submit <md-icon>send</md-icon></md-button>
          </md-card-actions>
        </md-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store, { globalFunctions } from '../store'
import router from '../router'

@Component
export default class Validate2FA extends Vue {
  code = ''

  beforeCreate () : void {
    if (globalFunctions.getToken() !== 'error')
      router.push('/').catch(() => { Function.prototype() })
  }

  async validateCode () : Promise<void> {
    const response = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/validate2fa`, {
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
      store.commit('setPopupMessage', 'Code is invalid or expired')
      this.code = ''
      return
    }
    const data = await response.json()
    store.commit('setToken', { token: data.token, expiresIn: data.expiresIn })
    store.commit('setLogged', true)
    store.commit('setUsername', data.name)
    store.commit('setUserId', data.id)
    store.commit('setRole', data.role)
    router.push('/').catch(() => { Function.prototype() })
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
