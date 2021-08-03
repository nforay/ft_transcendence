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
    <h1 v-if="checkStoreIsLogged()">You are logged in!</h1>
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
  public async created () : Promise<void> {
    if (document.cookie.indexOf('Token') <= -1) {
      store.commit('setLogged', false)
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/user/islogged', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token
      })
    })

    if (!response.ok) {
      store.commit('setLogged', false)
    } else {
      store.commit('setLogged', true)
    }
  }

  public checkStoreIsLogged () : boolean {
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
