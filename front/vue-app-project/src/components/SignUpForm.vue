<template>
  <div class="signup-form-content">
    <div v-if="this.errors.length !== 0">
      <b class="error-text">Please correct the following errors:</b>
      <li class="error-text" v-for="error in this.errors" :key="error">{{ error }}</li>
    </div>
    <br/>
    <div class="form">
      <div class="form-group">
        <label for="username">Username</label>
        <input class="username" type="text" v-model="username" id="signup-username" placeholder="Username">
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input class="email" type="text" v-model="email" id="signup-email" placeholder="Email">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input class="password" type="password" v-model="password" id="signup-password" placeholder="Password">
      </div>
      <div class="form-group">
        <label for="password">Confirm Password</label>
        <input class="confirm-password" type="password" v-model="confirmPassword" id="signup-confirm-password" placeholder="Password">
      </div>
      <button @click="signup">Sign Up</button>
    </div>
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
  public email = ''
  public password = ''
  public confirmPassword = ''

  public errors : string[] = []

  checkForm () : boolean {
    this.errors = []

    if (this.username.length === 0) {
      this.errors.push('Username cannot be empty')
    }

    if (this.email.length === 0) {
      this.errors.push('Email cannot be empty')
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
    if (!this.checkForm()) {
      return
    }

    const response = await fetch('http://localhost:4000/user/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: this.username,
        email: this.email,
        password: this.password
      })
    })

    if (!response.ok) {
      store.commit('logout')
      router.push('/login')
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

<style scoped>

  .error-text {
    text-align: left;
    color: red;
  }

  .signup-form-content {
    margin: 0 auto;
    width: 100%;
  }

  .form-group {
    margin-bottom: 10px;
  }

  label {
    display: block;
    text-align: left;
    margin-bottom: 3px;
    font-family: "Helvetica";
    font-size: 16px;
  }

  label:hover {
    cursor: text;
  }

  input {
    font-family: "Helvetica";
    border: 1px solid #ccc;
    border-radius: 3px;
    height: 35px;
    width: 100%;
    margin-bottom: 5px;
    font-size: 16px;
    padding-left: 7px;
  }

  input:focus {
    border: 1px solid #555;
  }

  button {
    display: block;
    margin: 0 auto;
    margin-top: 10px;
    border: none;
    background-color: #4CA750;
    width: 75%;
    color: white;
    height: 40px;
    font-size: 20px;
    font-family: "Helvetica";
    text-decoration: none;
  }

  button:hover {
    cursor: pointer;
    background-color: #499c50;
  }

  button:active {
    cursor: pointer;
    background-color: #3e9242;

  }
</style>
