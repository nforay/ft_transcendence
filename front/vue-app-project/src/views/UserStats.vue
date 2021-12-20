<template>
  <div>
    <div class="user-profile-content">
      <div class="user-avatar-content">
        <img class="avatar" :src="avatar" alt="Avatar">
      </div>
      <div class="username">
        <h1>{{ this.username }}</h1>
        <p class="bio">{{ this.bio }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { store, globalFunctions } from '@/store'
import router from '@/router'

@Component
export default class UserProfile extends Vue {
  public username = ''
  public bio = ''
  public avatar = ''

  thisuser: boolean

  constructor () {
    super()
    this.username = 'Username'
    this.bio = 'No bio written'
    this.avatar = ''
    this.thisuser = false
  }

  async beforeCreate () : Promise<void> {
    const token = globalFunctions.getToken()
    if (token === 'error') {
      router.push('/login')
    }
  }

  async mounted () : Promise<void> {
    if (!this.$route.query.user) {
      if (store.state.userId !== '') {
        this.thisuser = true
        const response = await fetch('http://localhost:4000/user/' + store.state.userId, {
          method: 'GET'
        })
        if (response.ok) {
          const data = await response.json()
          this.username = data.name
          this.bio = data.bio
          this.avatar = data.avatar
        }
      }
    } else {
      const response = await fetch('http://localhost:4000/user/username/' + this.$route.query.user, {
        method: 'GET'
      })
      if (response.ok) {
        const data = await response.json()
        this.username = data.name
        this.bio = data.bio
        this.avatar = data.avatar
      }
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
