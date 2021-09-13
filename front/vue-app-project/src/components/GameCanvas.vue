<template>
  <div class="game-canvas">
    <canvas id="canvas"></canvas>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { SocketManager } from '../utils/SocketManager'

@Component
export default class GameCanvas extends Vue {
  canvas: HTMLCanvasElement | undefined
  ctx: CanvasRenderingContext2D | undefined

  socketManager = new SocketManager('http://localhost:4001')

  backgroundColor = '#000'
  paddleColor = '#fff'
  ballColor = '#fff'

  initCanvas () : void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D

    const reference = Math.min(window.innerWidth, window.innerHeight)

    this.canvas.width = reference * 0.8 // 80% of the reference
    this.canvas.height = reference * 0.8 // 1:1 aspect ratio

    this.ctx.fillStyle = this.backgroundColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  mounted () : void {
    this.initCanvas()
  }
}
</script>

<style lang="scss" scoped>
</style>
