<template>
  <div class="game">
    <GameCanvas :gameid="this.gameId"></GameCanvas>
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
}
</script>

<style lang="scss" scoped>

</style>
