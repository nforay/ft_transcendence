<template>
  <div class="home">
    <kinesis-container class="container">
      <kinesis-element :strength="40" :originX="0" :originY="0" :minX="-10" :maxX="10" class="left_paddle">
        <svg height="200" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="20">
          <rect width="40" height="200"/>
        </svg>
      </kinesis-element>
      <kinesis-element :strength="80" class="ball">
        <svg height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" width="30">
          <rect width="30" height="30" />
        </svg>
      </kinesis-element>
      <kinesis-element :strength="40" :originX="100" :originY="100" :minX="-10" :maxX="10" class="right_paddle">
        <svg height="200" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" width="20">
          <rect width="40" height="200"/>
        </svg>
      </kinesis-element>
      <kinesis-element :strength="10" type="depth" class="title">
        <h1><span>ft_transcendence</span></h1>
      </kinesis-element>
      <kinesis-element :strength="10" type="depth_inv" class="textpong">
        <h2><span>"The mighty pong contest"</span></h2>
      </kinesis-element>
      <kinesis-element :strength="5" :originY="100" type="rotate" class="pongbutton">
        <md-button class="md-raised md-primary" href="/play">Play</md-button>
      </kinesis-element>
    </kinesis-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VueKinesis from 'vue-kinesis'

Vue.use(VueKinesis)

export default class Home extends Vue {}
</script>

<style lang="scss" scoped>
  .home {
    position: fixed;
    width: 100%;
    height: 80%;
    left: 0;
    top: 0;
  }

  .container {
    padding: 8rem;
    margin-top: 64px;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }

  .left_paddle {
    position: absolute;
    left: 5%;
    bottom: 30%;
  }

  .right_paddle {
    position: absolute;
    right: 5%;
    top: 20%;
  }

  .ball {
    position: absolute;
    left: 50%;
    bottom: 50%;
  }

  .title {
    position: absolute;
    top: 10%;
  }

  .textpong {
    position: absolute;
    bottom: 30%;
  }

  .pongbutton {
    position: absolute;
    bottom: 10%;
  }
</style>
