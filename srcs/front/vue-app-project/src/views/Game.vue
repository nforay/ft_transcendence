<template>
  <div class="game">
    <GameCanvas :gameId="this.gameId"></GameCanvas>
    <span>Controls: <kbd>Arrow Up</kbd> Move paddle up, <kbd>Arrow Down</kbd> Move paddle down, <kbd>Space</kbd> Use powerup</span>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import GameCanvas from "@/components/GameCanvas.vue";

@Component({
  components: {
    GameCanvas,
  },
})
export default class Game extends Vue {
  get gameId(): any {
    return this.$route.query.id.toString();
  }

  get gameJwt(): any {
    return this.$route.query.gameToken.toString();
  }
}
</script>

<style lang="scss" scoped>
kbd {
  background-color: #eee;
  border-radius: 3px;
  border: 1px solid #b4b4b4;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2),
    0 2px 0 0 rgba(255, 255, 255, 0.7) inset;
  color: #333;
  display: inline-block;
  font-size: 0.85em;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  white-space: nowrap;
}
</style>
