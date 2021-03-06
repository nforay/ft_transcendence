<template>
  <div class="game-canvas">
    <md-progress-bar md-mode="indeterminate" v-if="finished" />
    <canvas
      v-if="!isSpectator"
      id="canvas"
      tabindex="1"
      @keydown.up.prevent="leftPaddle.upPressed = true"
      @keydown.down.prevent="leftPaddle.downPressed = true"
      @keydown.space.prevent="usePowerup = true"
      @keyup.up.prevent="leftPaddle.upPressed = false"
      @keyup.down.prevent="leftPaddle.downPressed = false"
      @keyup.space.prevent="usePowerup = false"
    ></canvas>

    <canvas v-else id="canvas" tabindex="0"></canvas>

    <div class="game-data-flex">
      <img
        v-if="leftPaddle.avatar"
        class="player-card-avatar"
        :src="leftPaddle.avatar"
        alt="Avatar"
      />
      <img
        v-else
        class="player-card-avatar"
        src="../assets/avatar.jpg"
        alt="Avatar"
      />

      <span
        v-if="leftPaddle.name"
        style="flex-basis: 33%; text-align: left"
        class="game-data-versus game-data-username"
        >{{ leftPaddle.name }}</span
      >
      <span
        v-else
        class="game-data-versus game-data-username"
        style="flex-basis: 33%; text-align: left"
        >Player 1</span
      >

      <span class="game-data-versus">VS</span>

      <span
        v-if="rightPaddle.name"
        style="flex-basis: 33%; text-align: right"
        class="game-data-versus game-data-username"
        >{{ rightPaddle.name }}</span
      >
      <span
        v-else
        class="game-data-versus game-data-username"
        style="flex-basis: 33%; text-align: right"
        >Player 2</span
      >

      <img
        v-if="rightPaddle.avatar"
        class="player-card-avatar"
        :src="rightPaddle.avatar"
        alt="Avatar"
      />
      <img
        v-else
        class="player-card-avatar"
        src="../assets/avatar.jpg"
        alt="Avatar"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
#canvas {
  margin-top: 30px;
}

.player-card-avatar {
  width: 70px;
  height: 70px;
  border-radius: 5%;
  object-fit: cover;
}

@font-face {
  font-family: "Bit5x3";
  src: url("../assets/subset-Bit5x3.woff2") format("woff2"),
    url("../assets/subset-Bit5x3.woff") format("woff");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.game-data-flex {
  display: flex;
  justify-content: space-between;
  width: min(80vh, 80vw);
  margin: 15px auto;
}

.game-data-versus {
  font-size: 1.9em;
  margin: auto;
}

@media screen and (max-width: 850px) {
  .game-data-versus,
  .game-data-username {
    font-size: 1.5em;
  }
}

@media screen and (max-width: 700px) {
  .game-data-username {
    display: none;
  }
}
</style>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { SocketManager } from "../utils/SocketManager";
import store from "../store";
import router from "../router";
import { Prop } from "vue-property-decorator";
import { Watch } from "vue-property-decorator";

export class Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  upPressed = false;
  downPressed = false;
  speed = 0;
  score = 0;
  colorize = false;
  powerupColor = "#fff";
  avatar?: string;
  name?: string;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export class Ball {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  engage: boolean;

  constructor(
    x: number,
    y: number,
    radius: number,
    speedX: number,
    speedY: number,
    engage: boolean
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speedX = speedX;
    this.speedY = speedY;
    this.engage = engage;
  }
}

@Component({
  props: {
    gameId: {
      type: String,
    },
  },
})
export default class GameCanvas extends Vue {
  canvas: HTMLCanvasElement | undefined;
  ctx: CanvasRenderingContext2D | undefined;

  gameJwt = window.localStorage.getItem("gameJwt");
  @Prop({ type: String }) gameId!: string;

  socketManager = new SocketManager(
    "http://" +
      process.env.VUE_APP_DOMAIN +
      ":" +
      process.env.VUE_APP_GAME_PORT +
      "/?gameJwt=" +
      this.gameJwt
  );

  leftPaddle = new Paddle(0, 0, 0, 0);
  rightPaddle = new Paddle(0, 0, 0, 0);
  backgroundColor = "#000";
  paddleColor = "#fff";
  ballColor = "#fff";
  pixel = 50;
  invertX = false;
  usePowerup = false;

  finished = false;
  won = true;

  lastUpdate = new Date().getTime();

  acceptablePositionDesync = 200; // In a 2000x2000 canvas
  serverSyncFrequency = 1 / 20; // In seconds
  timeBeforeServerSync = this.serverSyncFrequency;
  packetId = 0;
  updateId = -1;

  ball = new Ball(0, 0, 0, 0, 0, false);
  obstacles: Obstacle[] = [];

  isSpectator = false;

  destroyed(): void {
    this.socketManager.disconnect();
    window.removeEventListener("resize", this.resizeCanvas);
    window.localStorage.removeItem("gameJwt");
  }

  switchgame(queryid: string): void {
    this.gameJwt = window.localStorage.getItem("gameJwt");
    this.gameId = queryid;
    this.socketManager.disconnect();
    this.socketManager = new SocketManager(
      "http://" +
        process.env.VUE_APP_DOMAIN +
        ":" +
        process.env.VUE_APP_GAME_PORT +
        "/?gameJwt=" +
        this.gameJwt
    );
    this.finished = false;
    this.initCanvas();
    this.retrievePositions();
    this.setupSocket();
  }

  gameLoop(): void {
    if (!this.canvas || !this.ctx) return;
    if (this.isSpectator) {
      this.draw();
      window.requestAnimationFrame(this.gameLoop);
      return;
    }

    const dir = +this.leftPaddle.downPressed - +this.leftPaddle.upPressed;

    const currentUpdate = new Date().getTime();
    const deltaTime = (currentUpdate - this.lastUpdate) / 1000;

    this.timeBeforeServerSync -= deltaTime;
    if (this.timeBeforeServerSync < 0) {
      // Send position data to server
      this.socketManager.sendMessage("move", {
        gameJwt: this.gameJwt,
        yPosition: this.leftPaddle.y,
        packetId: this.packetId,
      });
      if (this.usePowerup) {
        this.socketManager.sendMessage("usePowerup", {
          gameJwt: this.gameJwt,
          packetId: this.packetId,
        });
      }
      this.timeBeforeServerSync = this.serverSyncFrequency;
      this.packetId++;
    }

    this.leftPaddle.y += this.leftPaddle.speed * dir * deltaTime;
    this.leftPaddle.y = Math.min(
      Math.max(this.leftPaddle.y, this.leftPaddle.height / 2),
      2000 - this.leftPaddle.height / 2
    );

    this.ball.x += this.ball.speedX * deltaTime * (this.ball.engage ? 0.5 : 1);
    this.ball.y += this.ball.speedY * deltaTime * (this.ball.engage ? 0.5 : 1);

    this.draw();

    this.lastUpdate = currentUpdate;
    window.requestAnimationFrame(this.gameLoop);
  }

  draw(): void {
    if (!this.canvas || !this.ctx) return;
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const scalingFactor = this.canvas.width / 2000;

    this.ctx.fillStyle = "grey";
    for (
      let i = this.pixel * 0.5 * scalingFactor;
      i < this.canvas.height - this.pixel * scalingFactor;
      i += this.pixel * scalingFactor * 2
    ) {
      this.ctx.fillRect(
        this.canvas.width / 2 - (this.pixel / 4) * scalingFactor,
        i,
        (this.pixel / 2) * scalingFactor,
        this.pixel * scalingFactor
      ); // middle line
    }

    if (!this.finished) {
      this.ctx.fillStyle = "#ffffff";
      for (const obstacles of this.obstacles) {
        this.ctx.fillRect(
          obstacles.x * scalingFactor,
          obstacles.y * scalingFactor,
          obstacles.width * scalingFactor,
          obstacles.height * scalingFactor
        );
      }

      if (!this.leftPaddle.colorize) this.ctx.fillStyle = this.paddleColor;
      else this.ctx.fillStyle = this.leftPaddle.powerupColor;
      this.ctx.fillRect(
        (this.leftPaddle.x - this.leftPaddle.width / 2) * scalingFactor,
        (this.leftPaddle.y - this.leftPaddle.height / 2) * scalingFactor,
        this.leftPaddle.width * scalingFactor,
        this.leftPaddle.height * scalingFactor
      ); // left paddle

      if (!this.rightPaddle.colorize) this.ctx.fillStyle = this.paddleColor;
      else this.ctx.fillStyle = this.rightPaddle.powerupColor;
      this.ctx.fillRect(
        (this.rightPaddle.x - this.rightPaddle.width / 2) * scalingFactor,
        (this.rightPaddle.y - this.rightPaddle.height / 2) * scalingFactor,
        this.rightPaddle.width * scalingFactor,
        this.rightPaddle.height * scalingFactor
      ); // right paddle

      this.ctx.fillStyle = this.ballColor;
      this.ctx.beginPath();
      this.ctx.arc(
        (this.invertX ? 2000 - this.ball.x : this.ball.x) * scalingFactor,
        this.ball.y * scalingFactor,
        this.ball.radius * scalingFactor,
        0,
        2 * Math.PI
      ); // ball
      this.ctx.fill();
    }

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "120px bit5x3";
    this.ctx.textAlign = "right";
    this.ctx.fillText(
      this.leftPaddle.score.toString(),
      this.canvas.width / 2 - 30,
      100
    );
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      this.rightPaddle.score.toString(),
      this.canvas.width / 2 + 45,
      100
    );

    if (this.finished) {
      this.ctx.font = "72px Arial";
      this.ctx.textAlign = "center";
      if (!this.isSpectator) {
        this.ctx.fillText(
          this.won ? "You won!" : "You lost!",
          this.canvas.width / 2,
          this.canvas.height / 2
        );
      } else {
        this.ctx.fillText(
          "Game is over!",
          this.canvas.width / 2,
          this.canvas.height / 2
        );
      }
    }
  }

  resizeCanvas() {
    const reference = Math.min(window.innerWidth, window.innerHeight);

    this.canvas!.width = reference * 0.8; // 80% of the reference
    this.canvas!.height = reference * 0.8; // 1:1 aspect ratio

    this.draw();
  }

  initCanvas(): void {
    window.addEventListener("resize", this.resizeCanvas);
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    const reference = Math.min(window.innerWidth, window.innerHeight);

    this.canvas.width = reference * 0.8; // 80% of the reference
    this.canvas.height = reference * 0.8; // 1:1 aspect ratio

    this.rightPaddle.x = this.canvas.width - this.rightPaddle.width;
    this.rightPaddle.y = this.canvas.height / 2 - this.rightPaddle.height / 2;
    this.draw();
    window.requestAnimationFrame(this.gameLoop);
  }

  retrievePositions(): void {
    this.socketManager.on("init", (data) => {
      this.invertX = !data.isPlayer1;

      this.obstacles = data.game.obstacles;

      const you = data.isPlayer1 ? data.game.player1 : data.game.player2;
      const opponent = data.isPlayer1 ? data.game.player2 : data.game.player1;
      this.leftPaddle.x = 100;
      this.leftPaddle.y = you.y;
      this.leftPaddle.width = you.width;
      this.leftPaddle.height = you.height;
      this.leftPaddle.speed = you.speed;
      this.leftPaddle.score = you.score;
      this.leftPaddle.avatar = data.isPlayer1
        ? data.player1.avatar
        : data.player2.avatar;
      this.leftPaddle.name = data.isPlayer1
        ? data.player1.name
        : data.player2.name;

      this.rightPaddle.x = 1900;
      this.rightPaddle.y = opponent.y;
      this.rightPaddle.width = opponent.width;
      this.rightPaddle.height = opponent.height;
      this.rightPaddle.speed = opponent.speed;
      this.rightPaddle.score = opponent.score;
      this.rightPaddle.avatar = !data.isPlayer1
        ? data.player1.avatar
        : data.player2.avatar;
      this.rightPaddle.name = !data.isPlayer1
        ? data.player1.name
        : data.player2.name;

      this.ball.x = data.game.ballX;
      this.ball.y = data.game.ballY;
      this.ball.radius = data.game.ballRadius;
      this.ball.speedX = data.game.ballXSpeed;
      this.ball.speedY = data.game.ballYSpeed;
      this.ball.engage = data.game.engage;
    });
    this.socketManager.sendMessage("init", { gameJwt: this.gameJwt });
  }

  validatePosition(
    currentPosition: number,
    oldPosition: number,
    speed: number
  ): boolean {
    const direction = Math.sign(currentPosition - oldPosition);
    const deltaTime = 50 / 1000;
    const theoreticalPosition = oldPosition + speed * direction * deltaTime;
    return (
      Math.abs(currentPosition - theoreticalPosition) <
      this.acceptablePositionDesync
    );
  }

  finish(): void {
    this.finished = true;
    setTimeout(() => {
      if (this.$route.path === "/game") {
        router.push("/play").catch(() => {});
      }
    }, 3000);
  }

  setupSocket(): void {
    this.socketManager.on("broadcast", (data) => {
      if (data.game.id !== this.gameId) {
        return;
      }
      this.updateId = data.game.updateId;
      const you =
        store.state.userId === data.game.player1.id || this.isSpectator
          ? data.game.player1
          : data.game.player2;
      const opponent =
        store.state.userId === data.game.player1.id || this.isSpectator
          ? data.game.player2
          : data.game.player1;
      this.leftPaddle.x = 100;
      if (
        !this.validatePosition(this.leftPaddle.y, you.y, you.speed) ||
        this.isSpectator
      ) {
        this.leftPaddle.y = you.y;
      }
      this.leftPaddle.width = you.width;
      this.leftPaddle.height = you.height;
      this.leftPaddle.speed = you.speed;
      this.leftPaddle.score = you.score;
      if (you.powerup === "powerup_powerfist")
        this.leftPaddle.powerupColor = "#e8cf2c";
      else if (you.powerup === "powerup_dash")
        this.leftPaddle.powerupColor = "#429feb";

      this.leftPaddle.colorize = you.powerupEnabled;

      this.rightPaddle.x = 1900;
      this.rightPaddle.y = opponent.y;
      this.rightPaddle.width = opponent.width;
      this.rightPaddle.height = opponent.height;
      this.rightPaddle.speed = opponent.speed;
      this.rightPaddle.score = opponent.score;
      this.rightPaddle.colorize = opponent.powerupEnabled;
      if (opponent.powerup === "powerup_powerfist")
        this.rightPaddle.powerupColor = "#e8cf2c";
      else if (opponent.powerup === "powerup_dash")
        this.rightPaddle.powerupColor = "#429feb";

      this.ball.x = data.game.ballX;
      this.ball.y = data.game.ballY;
      this.ball.speedX = data.game.ballXSpeed;
      this.ball.speedY = data.game.ballYSpeed;
      this.ball.engage = data.game.engage;
    });

    this.socketManager.on("gameCanceled", () => {
      router.push("/play").catch(() => {
        Function.prototype();
      });
      store.commit(
        "setPopupMessage",
        "You were sent back to the play page because the game was canceled."
      );
      this.socketManager.disconnect();
    });

    this.socketManager.on("gameFinished", (data) => {
      this.won = data.winner === store.state.userId;
      this.finish();
    });
  }

  created(): void {
    this.isSpectator = window.localStorage.getItem("spectator") === "true";
    window.localStorage.removeItem("spectator");
  }

  mounted(): void {
    this.initCanvas();
    this.retrievePositions();
    this.setupSocket();
  }

  @Watch("$route")
  onRouteChange(to: any, from: any): void {
    this.switchgame(to.query.id);
  }
}
</script>
