<template>
  <div class="game-canvas">
    <canvas id="canvas" tabindex="0"
    @keydown.up="leftPaddle.upPressed = true"
    @keydown.down="leftPaddle.downPressed = true"
    @keyup.up="leftPaddle.upPressed = false"
    @keyup.down="leftPaddle.downPressed = false"></canvas>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { SocketManager } from '../utils/SocketManager'

export class Paddle {
  x: number
  y: number
  width: number
  height: number
  upPressed = false
  downPressed = false
  constructor (x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
}
@Component
export default class GameCanvas extends Vue {
  canvas: HTMLCanvasElement | undefined
  ctx: CanvasRenderingContext2D | undefined

  socketManager = new SocketManager('http://localhost:4001')

  leftPaddle = new Paddle(0, 0, 10, 100)
  rightPaddle = new Paddle(40, 0, 10, 100)
  backgroundColor = '#000'
  paddleColor = '#fff'
  ballColor = '#fff'
  paddleHeight = 80
  pixel = 15

  lastUpdate = new Date().getTime()

  serverSyncFrequency = 1 / 24 // In seconds
  timeBeforeServerSync = serverSyncFrequency

  gameLoop () : void {
    const dir = +this.leftPaddle.downPressed - (+this.leftPaddle.upPressed)

    const currentUpdate = new Date().getTime()
    const deltaTime = currentUpdate - this.lastUpdate / 1000

    this.timeBeforeServerSync -= deltaTime;
    if (this.timeBeforeServerSync < 0) {
      // Send position data to server
      
      this.timeBeforeServerSync = this.serverSyncFrequency
    }

    this.leftPaddle.y += dir * this.pixel
    this.draw()

    this.lastUpdate = currentUpdate
    window.requestAnimationFrame(this.gameLoop)
  }

  draw () : void {
    this.ctx.fillStyle = this.backgroundColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.fillStyle = 'grey'
    this.ctx.fillRect(0, 0, this.canvas.width, this.pixel) // top wall
    this.ctx.fillRect(0, this.canvas.height - this.pixel, this.canvas.width, this.canvas.height) // bottom wall
    for (let i = this.pixel; i < this.canvas.height - this.pixel; i += this.pixel * 2) {
      this.ctx.fillRect(this.canvas.width / 2 - this.pixel / 2, i, this.pixel, this.pixel) // middle line
    }
    this.ctx.fillStyle = 'white'
    this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height) // left paddle
    this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height) // right paddle
  }

  initCanvas () : void {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D

    const reference = Math.min(window.innerWidth, window.innerHeight)

    this.canvas.width = reference * 0.8 // 80% of the reference
    this.canvas.height = reference * 0.8 // 1:1 aspect ratio

    this.rightPaddle.x = this.canvas.width - this.rightPaddle.width
    this.rightPaddle.y = this.canvas.height / 2 - this.rightPaddle.height / 2
    this.draw()
    window.requestAnimationFrame(this.gameLoop)
  }

  mounted () : void {
    this.initCanvas()
  }
}
</script>

<style lang="scss" scoped>
</style>
