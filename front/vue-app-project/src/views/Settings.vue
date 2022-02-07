<template>
  <div class="settings-content">
      <div class="md-layout md-gutter">
      <div style="margin: 15px 0;" class="md-layout-item md-layout md-gutter md-alignment-top-center">
        <md-card v-if="loaded" style="min-width: 300px;" class="md-layout-item md-size-65">
          <md-card-header>
            <span class="md-title">User Settings</span>
          </md-card-header>
          
          <div class="md-layout md-size-100">
            <md-card-content style="text-align: right; position: relative;" class="md-layout md-layout-item md-alignment-center-center">
              <div class="md-layout-item">
                <div class="user-avatar-content">
                  <img class="avatar" :src="avatar" alt="Avatar">
                  <label class="avatar-edit">
                    <input hidden type="file" @change="onAvatarChange" accept=".jpg,.jpeg,.png">
                    <img src="../assets/camera.png" class="avatar-edit-icon">
                  </label>
                </div>
              </div>
              <div class="md-layout md-layout-item md-alignment-center-left">
                <md-field :class="messageClass">
                  <label>Username</label>
                  <md-input v-model="username" maxlength="16" required></md-input>
                  <span class="md-error">Username can't be empty</span>
                </md-field>
                <md-field md-clearable>
                  <label>Bio</label>
                  <md-textarea v-model="bio" maxlength="200"></md-textarea>
                </md-field>
              </div>
            </md-card-content>
          </div>
          <md-card-actions>
            <md-button class="md-primary" v-if="!twoFAIsEnabled" @click="reditectTo2FA" >Enable 2FA <md-icon>qr_code_2</md-icon></md-button>
            <md-button class="md-accent" v-else @click="reditectToCodePage" >Disable 2FA <md-icon>qr_code_2</md-icon></md-button>
            <md-button class="md-primary" @click="applyChanges" :disabled="username.length == 0">Update <md-icon>edit</md-icon></md-button>
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
export default class Settings extends Vue {
  public twoFAEnabled = false
  public startUsername = ''
  public username = ''
  public bio = ''
  public avatar = ''
  public loaded = false

  async beforeCreate () : Promise<void> {
    const token = globalFunctions.getToken()
    if (token === 'error') {
      router.push('/login').catch(() => { Function.prototype() })
      return
    }

    const response = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/has2fa`, {
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

  async mounted () : Promise<void> {
    while (!store.state.requestedLogin) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    if (this.userId === '') {
      return
    }
    const response = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/${this.userId}`, {
      method: 'GET'
    })
    if (response.ok) {
      const data = await response.json()
      this.username = data.name
      this.startUsername = data.name
      this.bio = data.bio
      this.avatar = data.avatar + '?' + Date.now()
      this.loaded = true
    }
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

  public async applyChanges () : Promise<void> {

    if (document.cookie.indexOf('Token=') === -1) {
      store.commit('logout')
      router.push('/').catch(() => { Function.prototype() })
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/update`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: this.username,
        bio: this.bio
      })
    })
    if (response.ok) {
      const data = await response.json()
      store.commit('setToken', { token: data.token, expiresIn: data.expiresIn })
      store.commit('setUsername', this.username)
    } else {
      store.commit('setPopupMessage', response.statusText)
    }
  }

  public async onAvatarChange (event : Event) : Promise<void> {
    if (document.cookie.indexOf('Token=') === -1) {
      store.commit('logout')
      router.push('/').catch(() => { Function.prototype() })
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const target = (event.target as HTMLInputElement)
    if (!target.files) {
      return
    }
    const file = target.files[0]
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/user/avatar/`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      },
      body: formData
    })
    if (response.ok) {
      const data = await response.json()
      // To force an image update, since url is the same
      this.avatar = data.avatar + '?' + new Date().getTime()
      store.commit('updateAvatar')
    }
  }

  public get messageClass () {
    return {
      'md-invalid': this.username.length === 0
    }
  }
}
</script>

<style scoped>
div.user-profile-content {
  position: relative;
  width: 60%;
  min-width: 700px;
  height: 270px;
  margin: 0 auto;
  border: 1px solid #ccc;
}

div.user-avatar-content {
  position: relative;
  float: left;
}

img.avatar {
  display: block;
  width: 250px;
  height: 250px;
  margin: 10px 10px 10px 10px;
  border-radius: 5%;
  overflow: hidden;
}

td.user-name {
  vertical-align: top;
}

h1 {
  font-family: "Helvetica";
  font-size: 32px;
  text-align: left;
}

div.username {
  margin-left: 270px;
}

img.avatar-edit-icon {
  position: absolute;
  color: white;
  top: 50%;
  left: 50%;
  width: 40%;
  height: auto;
  transform: translate(-50%, -50%);
}

label.avatar-edit {
  position: absolute;
  width: 250px;
  height: 250px;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5%;
  opacity: 0;
  transition: opacity 0.3s;
  margin: 10px 10px 10px 10px;
}

label.avatar-edit:hover {
  opacity: 1;
  cursor: pointer;
}

input[type=file] {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}

textarea.username-edit {
  display: block;
  max-width: 70%;
  height: 100%;
  font-size: 32px;
  font-family: "Helvetica";
  color: #333;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 3px;
  margin: 10px 10px 10px 0;
  resize: none;
}

p.bio {
  width: 100%;
  word-wrap: break-word;
  font-style: italic;
  font-size: 18px;
  font-family: "Helvetica";
  text-align: left;
}

textarea.edit-bio {
  display: block;
  font-size: 18px;
  font-family: "Helvetica";
  color: #333;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 3px;
  margin: 0px 10px 10px 0;
  resize: none;
  max-width: 70%;
}

button.apply {
  display: block;
  margin: 0 auto;
  margin-top: 10px;
  border: none;
  background-color: #4CA750;
  width: 20%;
  color: white;
  height: 40px;
  font-size: 20px;
  font-family: "Helvetica";
  text-decoration: none;
}

button.apply:hover {
  cursor: pointer;
  background-color: #499c50;
}

button.apply:active {
  cursor: pointer;
  background-color: #3e9242;

}
</style>
