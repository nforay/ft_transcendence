<template>
  <div></div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'

@Component
export default class Redirect extends Vue {
  created () {
    if (!this.$route.query.to || !this.$route.query.to.toString().startsWith('/')) {
      router.push('/').catch(() => {})
      return
    }
    router.push(this.$route.query.to.toString()).catch(() => {})
  }
}
</script>
