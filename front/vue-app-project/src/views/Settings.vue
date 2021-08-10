<template>
  <div class="settings-content">
    <UserProfile v-if="this.userId !== ''" :userId="this.userId" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import UserProfile from '@/components/UserProfile.vue'
import store from '@/store'

@Component({
  components: {
    UserProfile
  }
})
export default class Settings extends Vue {
  public get userId () : string {
    return store.state.userId
  }
}

</script>

<style scoped>

</style>
