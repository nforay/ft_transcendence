<template>
  <div class="content">
    <table cols="2">
      <td>
        <div class="login-div">
          <h1>Log In</h1>
          <hr class="login-hr">
          <LoginForm />
        </div>
      </td>
      <td>
        <div class="signup-div">
          <h1>Sign Up</h1>
          <hr class="login-hr">
          <SignUpForm />
        </div>
      </td>
    </table>
    <h1 v-if="checkLoggedIn()">You are logged in!</h1>
    <h1 v-else>You are not logged in!</h1>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import LoginForm from '@/components/LoginForm.vue'
import SignUpForm from '@/components/SignUpForm.vue'
import store from '@/store'

@Component({
  components: {
    LoginForm, SignUpForm
  }
})
export default class Login extends Vue {
  checkLoggedIn () : boolean {
    return store.state.isLogged
  }
}

</script>

<style scoped>
  div.content {
    width: 40%;
    margin: 0 auto;
  }

  table {
    margin: 0 auto;
    table-layout: fixed;
    width: 100%;
    margin-bottom: 100px;
  }

  td {
    padding-left: 30px;
    padding-right: 30px;
  }

  hr.login-hr {
    border: 0;
    height: 1px;
    background-image: -webkit-linear-gradient(left, #f0f0f0, #8c8b8b, #f0f0f0);
  }

</style>
