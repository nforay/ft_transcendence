<template>
  <div class="content">
    <div class="form">
      <div class="form-group">
        <label for="username">Username</label>
        <input class="username" type="text" v-model="username" id="username" placeholder="Username">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input class="password" type="password" v-model="password" id="password" placeholder="Password">
      </div>
      <button @click="login">Log In</button>
    </div>
  </div>
</template>

<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class LoginForm extends Vue {
  public username = ''
  public password = ''

  async login () : Promise<void> {
    const response = await fetch('http://localhost:4000/user/login', {
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
      const data = await response.json()
      console.log(response.status + ' ' + response.statusText + ' : ' + data.message)
    } else {
      const data = await response.json()
      const expires = new Date(new Date().getTime() + data.expiresIn).toUTCString()
      document.cookie = 'Token=' + data.token + ';expires=' + expires
      console.log(data.token)
    }
  }
}
</script>

<style scoped>
  .form {
    width: 15%;
    margin: 0 auto;
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
