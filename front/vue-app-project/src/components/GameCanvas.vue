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
import store from '../store'
import router from '../router'

export class Paddle {
  x: number
  y: number
  width: number
  height: number
  upPressed = false
  downPressed = false
  speed = 0

  constructor (x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
}

export class Ball {
  x: number
  y: number
  radius: number
  speed: number
  angle: number

  constructor (x: number, y: number, radius: number, speed: number, angle: number) {
    this.x = x
    this.y = y
    this.radius = radius
    this.speed = speed
    this.angle = angle
  }
}

@Component({
  props: {
    gameId: {
      type: String
    },
    gameJwt: {
      type: String
    }
  }
})
export default class GameCanvas extends Vue {
  canvas: HTMLCanvasElement | undefined
  ctx: CanvasRenderingContext2D | undefined

  socketManager = new SocketManager('http://localhost:4001/?gameJwt=' + this.gameJwt)

  leftPaddle = new Paddle(0, 0, 0, 0)
  rightPaddle = new Paddle(0, 0, 0, 0)
  backgroundColor = '#000'
  paddleColor = '#fff'
  ballColor = '#fff'
  pixel = 15
  invertX = false

  lastUpdate = new Date().getTime()

  acceptablePositionDesync = 50 // In a 2000x2000 canvas
  serverSyncFrequency = 1 / 24 // In seconds
  timeBeforeServerSync = this.serverSyncFrequency

  ball = new Ball(0, 0, 0, 0, 0)

  destroyed () {
    this.socketManager.disconnect()
  }

  gameLoop () : void {
    const dir = +this.leftPaddle.downPressed - (+this.leftPaddle.upPressed)

    const currentUpdate = new Date().getTime()
    const deltaTime = (currentUpdate - this.lastUpdate) / 1000

    this.timeBeforeServerSync -= deltaTime
    if (this.timeBeforeServerSync < 0) {
      // Send position data to server
      this.socketManager.sendMessage('move', {
        gameJwt: this.gameJwt,
        yPosition: this.leftPaddle.y
      })
      this.timeBeforeServerSync = this.serverSyncFrequency
    }

    this.leftPaddle.y += this.leftPaddle.speed * dir * deltaTime

    this.ball.x += this.ball.speed * Math.cos(this.ball.angle) * deltaTime
    this.ball.y += this.ball.speed * Math.sin(this.ball.angle) * deltaTime

    this.draw()

    this.lastUpdate = currentUpdate
    window.requestAnimationFrame(this.gameLoop)
  }

  draw () : void {
    this.ctx.fillStyle = this.backgroundColor
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const scalingFactor = this.canvas.width / 2000

    this.ctx.fillStyle = 'grey'
    this.ctx.fillRect(0, 0, this.canvas.width, this.pixel) // top wall
    this.ctx.fillRect(0, this.canvas.height - this.pixel, this.canvas.width, this.canvas.height) // bottom wall
    for (let i = this.pixel; i < this.canvas.height - this.pixel; i += this.pixel * 2) {
      this.ctx.fillRect(this.canvas.width / 2 - this.pixel / 2, i, this.pixel, this.pixel) // middle line
    }

    this.ctx.fillStyle = this.paddleColor
    this.ctx.fillRect((this.leftPaddle.x - this.leftPaddle.width / 2) * scalingFactor, (this.leftPaddle.y - this.leftPaddle.height / 2) * scalingFactor, this.leftPaddle.width * scalingFactor, this.leftPaddle.height * scalingFactor) // left paddle
    this.ctx.fillRect((this.rightPaddle.x - this.rightPaddle.width / 2) * scalingFactor, (this.rightPaddle.y - this.rightPaddle.height / 2) * scalingFactor, this.rightPaddle.width * scalingFactor, this.rightPaddle.height * scalingFactor) // right paddle

    this.ctx.fillStyle = this.ballColor
    this.ctx.beginPath()
    this.ctx.arc((this.invertX ? 2000 - this.ball.x : this.ball.x) * scalingFactor, this.ball.y * scalingFactor, this.ball.radius * scalingFactor, 0, 2 * Math.PI) // ball
    this.ctx.fill()
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

  retrievePositions () : void {
    this.socketManager.on('init', (data) => {
      this.invertX = !data.isPlayer1

      const you = data.isPlayer1 ? data.game.player1 : data.game.player2
      const opponent = data.isPlayer1 ? data.game.player2 : data.game.player1
      this.leftPaddle.x = 100
      this.leftPaddle.y = you.y
      this.leftPaddle.width = you.width
      this.leftPaddle.height = you.height
      this.leftPaddle.speed = you.speed

      this.rightPaddle.x = 1900
      this.rightPaddle.y = opponent.y
      this.rightPaddle.width = opponent.width
      this.rightPaddle.height = opponent.height
      this.rightPaddle.speed = opponent.speed

      this.ball.x = data.game.ballX
      this.ball.y = data.game.ballY
      this.ball.radius = data.game.ballRadius
      this.ball.speed = data.game.ballSpeed
      this.ball.angle = data.game.ballAngle
    })
    this.socketManager.sendMessage('init', { gameJwt: this.gameJwt })
  }

  validatePosition (currentPosition: number, oldPosition: number, speed: number, oldPositionTime: number) : boolean {
    const direction = Math.sign(currentPosition - oldPosition)
    const time = new Date().getTime()
    const deltaTime = (time - oldPositionTime) / 1000
    const theoreticalPosition = oldPosition + speed * direction * deltaTime
    return Math.abs(currentPosition - theoreticalPosition) < this.acceptablePositionDesync
  }

  setupSocket () : void {
    this.socketManager.on('broadcast', (data) => {
      if (data.game.id !== this.gameId) {
        return
      }
      const you = store.state.userId === data.game.player1.id ? data.game.player1 : data.game.player2
      const opponent = store.state.userId === data.game.player1.id ? data.game.player2 : data.game.player1
      this.leftPaddle.x = 100
      if (!this.validatePosition(this.leftPaddle.y, you.y, you.speed, data.time)) {
        this.leftPaddle.y = you.y
      }
      this.leftPaddle.width = you.width
      this.leftPaddle.height = you.height
      this.leftPaddle.speed = you.speed

      this.rightPaddle.x = 1900
      this.rightPaddle.y = opponent.y
      this.rightPaddle.width = opponent.width
      this.rightPaddle.height = opponent.height
      this.rightPaddle.speed = opponent.speed

      this.ball.x = data.game.ballX
      this.ball.y = data.game.ballY
      this.ball.speed = data.game.ballSpeed
      this.ball.angle = data.game.ballAngle
    })

    this.socketManager.on('gameCancelled', () => {
      router.push('/play')
    })
  }

  mounted () : void {
    this.initCanvas()
    this.retrievePositions()
    this.setupSocket()
  }
}
</script>

<style lang="scss" scoped>
</style>
