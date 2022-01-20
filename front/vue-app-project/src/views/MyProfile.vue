<template>
  <div></div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'

@Component
export default class MyProfile extends Vue {
  created () {
    router.push('/profile')
  }
}
</script>
