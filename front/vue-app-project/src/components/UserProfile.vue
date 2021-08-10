<template>
  <div class="user-profile-content">
    <table>
      <td>
        <div class="user-avatar-content">
          <img class="avatar" :src="avatar" alt="Avatar">
          <label class="avatar-edit">
            <input hidden type="file" @change="onAvatarChange" accept=".jpg,.jpeg,.png">
            <img src="../assets/camera.png" class="avatar-edit-icon">
          </label>
        </div>
      </td>
      <td class="user-name">
        <h1>{{ this.username }}</h1>
        <p v-if="this.bio !== ''">{{ this.bio }}</p>
      </td>
    </table>
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
  public username = ''
  public bio = ''
  public avatar = ''

  constructor () {
    super()
    this.username = ''
    this.bio = ''
    this.avatar = ''
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
      this.bio = data.bio
      this.avatar = data.avatar
    }
  }

  public async onAvatarChange (event : Event) : Promise<void> {
    if (document.cookie.indexOf('Token=') === -1) {
      store.commit('logout')
      router.push('/')
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
      this.avatar = data.avatar
      console.log(this.avatar)
    }
  }
}
</script>

<style scoped>
  div.user-profile-content {
    position: relative;
    width: 60%;
    margin: 0 auto;
    border: 1px solid #ccc;
  }

  div.user-avatar-content {
    position: relative;
  }

  img.avatar {
    display: block;
    width: 250px;
    height: 250px;
    margin: 10px 10px 10px 10px;
    border-radius: 30%;
  }

  td.user-name {
    vertical-align: top;
  }

  h1 {
    font-family: "Helvetica";
    font-size: 32px;
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
    top: -10px;
    left: 0;
    right: 0;
    height: 100%;
    width: 250px;
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

</style>
