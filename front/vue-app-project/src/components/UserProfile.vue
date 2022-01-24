<template>
  <div>
    <div class="user-profile-content">
      <div class="user-avatar-content">
        <img class="avatar" :src="avatar" alt="Avatar">
        <label class="avatar-edit">
          <input hidden type="file" @change="onAvatarChange" accept=".jpg,.jpeg,.png">
          <img src="../assets/camera.png" class="avatar-edit-icon">
        </label>
      </div>
      <div class="username">
        <h1 v-if="!this.editUsername" @click="toggleEditUsername">{{ this.username }}</h1>
        <textarea v-else rows="1" cols="16" class="username-edit" v-model="username" @blur="toggleEditUsername" maxlength="16"></textarea>
        <p class="bio" v-if="this.bio !== '' && !this.editBio" @click="toggleEditBio">{{ this.bio }}</p>
        <p class="bio" v-else-if="!this.editBio" @click="toggleEditBio">Add a bio</p>
        <textarea rows="8" cols="50" v-if="this.editBio" class="edit-bio" v-model="bio" @blur="toggleEditBio" maxlength="400"></textarea>
      </div>
    </div>
    <button class="apply" v-if="!this.editBio && !this.editUsername && this.changed" @click="applyChanges">Apply Changes</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import store from '@/store'
import router from '@/router'

@Component
export default class UserProfile extends Vue {
  @Prop({ type: String, required: true }) public userId!: string
  public startUsername = ''
  public username = ''
  public bio = ''
  public avatar = ''

  public editUsername = false
  public editBio = false
  public changed = false

  constructor () {
    super()
    this.username = ''
    this.startUsername = ''
    this.bio = ''
    this.avatar = ''
    this.editUsername = false
    this.editBio = false
    this.changed = false
  }

  public async applyChanges () : Promise<void> {
    this.changed = false

    if (document.cookie.indexOf('Token=') === -1) {
      store.commit('logout')
      router.push('/').catch(() => { Function.prototype() })
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/user/update', {
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

  public toggleEditUsername () : void {
    if (this.editUsername && this.username.length === 0) {
      this.username = this.startUsername
      store.commit('setPopupMessage', 'Username cannot be empty')
    }
    this.changed = true
    this.editUsername = !this.editUsername
  }

  public toggleEditBio () : void {
    this.editBio = !this.editBio
    this.changed = true
  }

  async mounted () : Promise<void> {
    if (this.userId === '') {
      return
    }
    const response = await fetch('http://localhost:4000/user/' + this.userId, {
      method: 'GET'
    })
    if (response.ok) {
      const data = await response.json()
      this.username = data.name
      this.startUsername = data.name
      this.bio = data.bio
      this.avatar = data.avatar
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
    const response = await fetch('http://localhost:4000/user/avatar/', {
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
    border-radius: 30%;
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
    border-radius: 30%;
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
