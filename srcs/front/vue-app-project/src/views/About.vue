<template>
  <div class="about">
    <h1>What is this project?</h1>
    <p style="font-size: 1.2em">
      This project is a simple web application that allows you to play Pong
      online. With a ladder system, user accounts, spectators, two powerups, two
      maps, a real-time chat.
    </p>

    <h2>How to play?</h2>
    <p style="font-size: 1.2em">
      You can play with a friend by clicking on the "challenge" button on your
      friend's profile page or with random people using the play page. Games
      launched from the play page are ranked games.
    </p>
    <span
      >Controls: <kbd>Arrow Up</kbd> Move paddle up, <kbd>Arrow Down</kbd> Move
      paddle down, <kbd>Space</kbd> Use powerup</span
    >
    <h2>The elo system</h2>
    <p style="font-size: 1.2em">
      The elo system is based on the
      <a href="https://en.wikipedia.org/wiki/Elo_rating_system"
        >Elo rating system</a
      >
      and is used to rank players. The elo rating is the precise amount of
      points you have. But you will often see grades representing a range of
      elo. Those being:
      <md-table v-model="ranks" md-card class="rank-table">
        <md-table-toolbar>
          <h1 class="md-title">Grades</h1>
        </md-table-toolbar>

        <md-table-row>
          <md-table-head class="md-xsmall-hide">Icon</md-table-head>
          <md-table-head>Name</md-table-head>
          <md-table-head>Range</md-table-head>
        </md-table-row>

        <md-table-row v-for="(rank, i) of ranks" :key="i">
          <md-table-cell class="md-xsmall-hide" md-label="Rank"
            ><img class="grade-img" :src="rank.icon"
          /></md-table-cell>
          <md-table-cell md-label="Name">{{ rank.name }}</md-table-cell>
          <md-table-cell md-label="Range">{{ rank.range }}</md-table-cell>
        </md-table-row>
      </md-table>
    </p>

    <h1>Who made this project?</h1>
    <p style="font-size: 1.2em">
      This project was made by
      <a href="https://www.github.com/nforay">Nicolas Foray</a>,
      <a href="https://www.github.com/mbourand">Maxime Bourand</a> and
      <a href="https://www.github.com/hpottier">Hector Pottier</a>
      as the final project of the 42 School's common core.
    </p>

    <h1>How does it work?</h1>
    <p style="font-size: 1.2em">
      The project was built with Vue.js, Nest.js, Postgresql, Docker compose,
      Socket.io and many other technologies.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class About extends Vue {
  public ranks = [
    { icon: "/master.png", name: "Master", range: "1601+" },
    { icon: "/gold_3.png", name: "Gold 3", range: "1501 - 1600" },
    { icon: "/gold_2.png", name: "Gold 2", range: "1401 - 1500" },
    { icon: "/gold_1.png", name: "Gold 1", range: "1301 - 1400" },
    { icon: "/silver_3.png", name: "Silver 3", range: "1201 - 1300" },
    { icon: "/silver_2.png", name: "Silver 2", range: "1101 - 1200" },
    { icon: "/silver_1.png", name: "Silver 1", range: "1100-" },
  ];
}
</script>

<style scoped>
.about {
  width: 70%;
  margin: auto;
}

.rank-table {
  width: 40%;
  margin: 20px auto;
}

@media screen and (max-width: 1200px) {
  .rank-table {
    width: 70%;
  }
}

@media screen and (max-width: 700px) {
  .rank-table {
    width: 100%;
  }
}

.grade-img {
  max-width: 50px;
  max-height: 50px;
}

.grade-info {
  margin: auto;
  min-width: 150px;
  max-width: 150px;
  flex-basis: 150px;
}

.grade-flex {
  position: relative;
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
}

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
