<template>
  <div id="leaderboard-container">
    <md-table class="leaderboard-table" v-if="leaderboard.length > 0" md-card>
      <md-table-toolbar>
        <span class="md-title">Leaderboard</span>
      </md-table-toolbar>
      <md-table-row>
        <md-table-head>Rank</md-table-head>
        <md-table-head>Avatar</md-table-head>
        <md-table-head>Name</md-table-head>
        <md-table-head>Elo</md-table-head>
        <md-table-head class="md-medium-hide">Play Count</md-table-head>
        <md-table-head class="md-small-hide">Wins</md-table-head>
        <md-table-head class="md-small-hide">Loss</md-table-head>
        <md-table-head>W/L Ratio</md-table-head>
        <md-table-head style="text-align: center;">Level</md-table-head>
      </md-table-row>
      <md-table-row v-for="(player, i) of this.leaderboard" :key="i">
        <md-table-cell style="width: 0;">#{{ i + 1 }}</md-table-cell>
        <md-table-cell style="width: 0;" class="leaderboard-avatar">
          <router-link :to="`/profile?user=${player.username}`">
            <img class="leaderboard-avatar" :src="userAvatar(player.id)">
          </router-link>
        </md-table-cell>
        <md-table-cell style="width: 30%; text-align: left"><router-link :to="`/profile?user=${player.username}`">{{ player.username }}</router-link></md-table-cell>
        <md-table-cell>{{ player.elo }}</md-table-cell>
        <md-table-cell class="md-medium-hide">{{ player.win + player.loss }}</md-table-cell>
        <md-table-cell class="md-small-hide">{{ player.win }}</md-table-cell>
        <md-table-cell class="md-small-hide">{{ player.loss }}</md-table-cell>
        <md-table-cell>{{ Math.round(player.win / Math.max(player.loss, 1) * 100) / 100 }}</md-table-cell>
        <md-table-cell style="width: 17%;">
          LV {{ Math.floor(player.level) }} - {{ Math.floor(Math.floor(getXpProgress(player.level) * 100) / 100) }}%
          <md-progress-bar md-mode="determinate" :md-value="getXpProgress(player.level)"></md-progress-bar>
        </md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store from '@/store'

class LeaderboardPlayerData {
  public id: string
  public username: string
  public win: number
  public loss: number
  public elo: number
  public level: number;

  constructor (id: string, username: string, win: number, loss: number, elo: number, level: number) {
    this.id = id
    this.username = username
    this.win = win
    this.loss = loss
    this.elo = elo
    this.level = level
  }
}

@Component
export default class Leaderboard extends Vue {
  public page = 0
  public pageSize = 50
  public leaderboard: Array<LeaderboardPlayerData> = []
  async created () : Promise<void> {
    const response = await fetch(`http://localhost:4000/user/leaderboard?rangeMin=${this.page * this.pageSize}&rangeMax=${(this.page + 1) * this.pageSize}`, {
      method: 'GET'
    })
    if (!response.ok) {
      store.commit('setPopupMessage', 'Cannot get leaderboard')
      return
    }

    const data = await response.json()
    for (const player of data.players) {
      this.leaderboard.push(new LeaderboardPlayerData(player.id, player.name, player.win, player.lose, player.elo, player.level))
    }
    this.leaderboard.sort((a, b) => { return b.elo - a.elo })
  }

  userAvatar (id: string) : string {
    return 'http://localhost:4000/user/avatar/' + id
  }

  getXpProgress (level: number) : number {
    return (level - Math.floor(level)) * 100
  }
}
</script>

<style lang="scss" scoped>

.leaderboard-table {
  width: 90%;
  margin: 20px auto;
}

.leaderboard-avatar {
  max-width: 50px;
}

img.leaderboard-avatar {
  width: 50px;
  height: 50px;
  border-radius: 5%;
  object-fit: cover;
}
</style>
