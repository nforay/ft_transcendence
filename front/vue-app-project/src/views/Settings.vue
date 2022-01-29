<template>
  <div class="settings-content">
    <UserProfile v-if="this.userId !== ''" :userId="this.userId" />
    <hr/>

    <button v-show="!twoFAIsEnabled" @click="reditectTo2FA">Enable Two Factor Authentication</button>
    <button v-show="twoFAIsEnabled" @click="reditectToCodePage">Disable Two Factor Authentication</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import UserProfile from '../components/UserProfile.vue'
import store, { globalFunctions } from '../store'
import router from '../router'

@Component({
  components: {
    UserProfile
  }
})
export default class Settings extends Vue {
  twoFAEnabled = false

  async beforeCreate () : Promise<void> {
    const token = globalFunctions.getToken()
    if (token === 'error') {
      router.push('/login').catch(() => { Function.prototype() })
      return
    }

    const response = await fetch('http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/has2fa', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      router.push('/login').catch(() => { Function.prototype() })
      return
    }
    const data = await response.json()
    this.twoFAEnabled = data.enabled
  }

  public get userId () : string {
    return store.state.userId
  }

  public get twoFAIsEnabled () : boolean {
    return this.twoFAEnabled
  }

  public reditectTo2FA () : void {
    router.push('/enable2fa').catch(() => { Function.prototype() })
  }

  public reditectToCodePage () : void {
    router.push('/disable2fa').catch(() => { Function.prototype() })
  }
}

</script>

<style scoped>

</style>
