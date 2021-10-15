<template>
  <div class="play">
    <button v-if="!this.queueJoined" @click="joinQueue()">Join queue</button>
    <button v-else @click="leaveQueue()">Leave queue</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import router from '../router'

@Component
export default class Play extends Vue {
  queueJoined = false;

  created () : void {
    document.addEventListener('beforeunload', this.leaveQueue)
  }

  mounted () : void {
    window.setInterval(() => {
      this.checkQueue()
    }, 1000)
  }

  async checkQueue () : Promise<void> {
    if (!this.queueJoined || document.cookie.indexOf('Token') === -1) {
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/matchmaking/poll', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      return
    }
    const data = await response.json()
    if (data.found) {
      this.queueJoined = false
      router.push(`/game?id=${data.gameId}&gameToken=${data.gameJwt}`)
    }
  }

  async joinQueue () : Promise<void> {
    if (document.cookie.indexOf('Token') === -1) {
      alert('You must be logged in to join the queue')
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/matchmaking/join', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      return
    }
    const data = await response.json()
    this.queueJoined = data.accepted
  }

  async leaveQueue () : Promise<void> {
    if (document.cookie.indexOf('Token') === -1) {
      alert('You must be logged in to leave the queue')
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/matchmaking/leave', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      return
    }
    const data = await response.json()
    this.queueJoined = !data.left
  }
}

</script>

<style lang="scss" scoped>
</style>
