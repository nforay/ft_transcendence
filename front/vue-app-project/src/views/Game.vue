<template>
  <div class="game">
    <GameCanvas :gameId="this.gameId" :gameJwt="this.gameJwt"></GameCanvas>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import GameCanvas from '@/components/GameCanvas.vue'

@Component({
  components: {
    GameCanvas
  }
})
export default class Game extends Vue {
  get gameId () : any {
    return this.$route.query.id.toString()
  }

  get gameJwt () : any {
    return this.$route.query.gameToken.toString()
  }
}
</script>

<style lang="scss" scoped>

</style>
