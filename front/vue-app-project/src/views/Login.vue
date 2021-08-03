<template>
  <div class="content">
    <LoginForm />
    <h1 v-if="this.isLogged">You are logged in!</h1>
    <h1 v-else>You are not logged in!</h1>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import LoginForm from '@/components/LoginForm.vue'

@Component({
  components: {
    LoginForm
  }
})
export default class Login extends Vue {
  public isLogged = false;

  public async created () : Promise<void> {
    if (document.cookie.indexOf('Token') <= -1) {
      this.isLogged = false
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
      this.isLogged = false
    }
    this.isLogged = true
  }
}
</script>

<style scoped>
</style>
