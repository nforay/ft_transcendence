<template>
  <div>
    <UserCard v-if="username.length > 0" :username="username" />
    <div>
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-layout md-gutter">
          <div class="md-layout-item" style="margin: 5px 0;">
            <span class="md-title">Match History</span>
            <md-table style="max-height: 50vh;" v-if="history.length > 0" md-card>
              <md-table-row v-for="(res, i) in history" :key="i">
                <md-table-cell><span :class="getClass(res)"><md-icon :class="getClass(res)">{{ res.icon(username) }}</md-icon></span></md-table-cell>
                <md-table-cell><img class="friend-avatar" :src="res.avatarLeft(username)"></md-table-cell>
                <md-table-cell><span :class="getClass(res)">{{ res.format(username) }}</span></md-table-cell>
                <md-table-cell><img class="friend-avatar" :src="res.avatarRight(username)"></md-table-cell>
              </md-table-row>
            </md-table>
          </div>
          <div class="md-layout-item" style="margin: 5px 0;">
            <span class="md-title">Friend list</span>
            <md-table style="max-height: 50vh;" v-if="friends.length > 0" md-card>
              <md-table-row>
                <md-table-head class="md-xsmall-hide" style="position: relative; width: 50px;">Avatar</md-table-head>
                <md-table-head>Name</md-table-head>
                <md-table-head md-numeric>Elo</md-table-head>
                <md-table-head>Level</md-table-head>
              </md-table-row>
              <md-table-row style="cursor: pointer;" v-for="(friend, i) in friends" :key="i" @click="loadProfile(friend.username)">
                <md-table-cell style="width: 0;" class="md-xsmall-hide">
                  <div style="position: relative; width: 50px;">
                    <img class="friend-avatar" :src="friend.avatar">
                    <div :class="friend.htmlStatusClasses" :src="friend.statusImage"></div>
                  </div>
                </md-table-cell>
                <md-table-cell style="width: 0;">{{ friend.username }}</md-table-cell>
                <md-table-cell md-numeric><md-icon>emoji_events</md-icon>{{ friend.elo }}</md-table-cell>
                <md-table-cell style="width: 25%;">
                  LV {{ Math.floor(friend.level) }} - {{ Math.floor(Math.floor(getXpProgress(friend.level) * 100) / 100) }}%
                  <md-progress-bar md-mode="determinate" :md-value="getXpProgress(friend.level)"></md-progress-bar>
                </md-table-cell>
              </md-table-row>
            </md-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import store, { globalFunctions } from '../store'
import router from '../router'
import { Watch } from 'vue-property-decorator'
import UserCard from '../components/UserCard.vue'

class GameData {
  public player1Id = ''
  public player2Id = ''
  public player1Avatar = ''
  public player2Avatar = ''
  public player1Name = ''
  public player2Name = ''
  public player1Score = 0;
  public player2Score = 0;
  public player1Won = true

  constructor (player1Id: string, player2Id: string, player1Avatar: string, player2Avatar: string, player1Name: string, player2Name: string, score1: number, score2: number, player1Won: boolean) {
    this.player1Id = player1Id
    this.player2Id = player2Id
    this.player1Avatar = player1Avatar
    this.player2Avatar = player2Avatar
    this.player1Name = player1Name
    this.player2Name = player2Name
    this.player1Score = score1
    this.player2Score = score2
    this.player1Won = player1Won
  }

  format (username: string) : string {
    const userScore = (username === this.player1Name ? this.player1Score : this.player2Score)
    const opponentScore = (username === this.player1Name ? this.player2Score : this.player1Score)
    const opponentName = (username === this.player1Name ? this.player2Name : this.player1Name)
    return `${username} ${userScore} - ${opponentScore} ${opponentName}`
  }

  icon (username: string) : string {
    if (username === this.player1Name ? this.player1Won : !this.player1Won) {
      return 'add_box'
    } else {
      return 'indeterminate_check_box'
    }
  }

  avatarLeft (username: string) : string {
    return `${username === this.player1Name ? this.player1Avatar : this.player2Avatar}`
  }

  avatarRight (username: string) : string {
    return `${username === this.player1Name ? this.player2Avatar : this.player1Avatar}`
  }
}

@Component({
  components: {
    UserCard
  }
})
export default class UserStats extends Vue {

  public history: GameData[] = []
  public friends: string[] = []

  // Vars UserCard
  public username = ''

  constructor () {
    super()
    this.username = (this.$route.query.user ? this.$route.query.user.toString() : store.state.username)
  }

  async mounted (): Promise<void> {
    while (!store.state.requestedLogin) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    const token = globalFunctions.getToken()
    if (token === 'error') {
      router.push('/').catch(() => { Function.prototype() })
      return
    }

    this.username = (this.$route.query.user ? this.$route.query.user.toString() : store.state.username)
    this.queryStats(this.username)
  }

  async loadProfile (username: string): Promise<void> {
    if (username !== this.$route.query.user) {
      this.$router.push({ query: { user: username } })
    }
  }

  getXpProgress (level: number) : number {
    return (level - Math.floor(level)) * 100
  }

  async queryStats (username: string): Promise<void> {
    this.username = (this.$route.query.user ? this.$route.query.user.toString() : store.state.username)

    const friendlistResponse = await fetch(
      process.env.VUE_APP_URL + ':' + process.env.VUE_APP_NEST_PORT + '/user/friends/name/' + this.username, {
        method: 'GET'
      }
    )
    if (!friendlistResponse.ok) {
      return
    }
    const friendlistData = await friendlistResponse.json()
    this.friends = friendlistData.map(friend => {
      return {
        username: friend.name,
        url: '/redirect?to=/profile?user=' + friend.name,
        avatar: friend.avatar,
        elo: friend.elo,
        level: friend.level,
        htmlStatusClasses: 'status-icon status-' + friend.status
      }
    })

    const matchHistory = await fetch(
      process.env.VUE_APP_URL + ':' + process.env.VUE_APP_NEST_PORT + '/user/history/name/' + this.username, {
        method: 'GET'
      }
    )
    if (!matchHistory.ok) {
      return
    }
    const matchHistoryData = await matchHistory.json()
    this.history = matchHistoryData.map(match => {
      return new GameData(
        match.player1Id,
        match.player2Id,
        match.player1Avatar,
        match.player2Avatar,
        match.player1Name,
        match.player2Name,
        match.player1Score,
        match.player2Score,
        match.player1Won
      )
    })
  }

  getClass (item : any) : string {
    if (this.username === item.player1Name ? item.player1Won : !item.player1Won) {
      return 'history-win'
    }
    return 'history-lose'
  }

  @Watch('$route')
  onRouteChange (to: any, from: any) : void {
    this.queryStats(to.query.user)
  }
}
</script>

<style scoped>

img.locked-achievement {
  filter: saturate(0) brightness(80%);
  opacity: 0.8;
}

img.achievement-medal {
  width: auto;
  height: 100px;
}

img.friend-avatar {
  display: block;
  width: 50px;
  min-width: 50px;
  height: 50px;
  border-radius: 5px;
  overflow: hidden;
}

div.status-online {
  background-color: #4CAF50;
}

div.status-offline {
  background-color: #777777;
}

div.status-ingame {
  background-color: #F44336;
}

div.status-icon {
  position: absolute;
  bottom: -3px;
  left: 40px;
  width: 15px;
  height: 15px;
  margin: 0;
  padding: 0;
  border-radius: 50%;
}

span.history-win {
  color: green;
}

span.history-lose {
  color: red;
}

.md-icon.history-win {
  color: #00800050;
}

.md-icon.history-lose {
  color: #ff000050;
}

</style>
