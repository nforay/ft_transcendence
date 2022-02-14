<template>
  <div class="md-layout md-gutter">
    <div style="margin: 15px 0;" class="md-layout-item md-layout md-gutter md-alignment-top-center">
      <md-card style="min-width: 300px;" class="md-layout-item md-size-65">
        <md-card-header>
        </md-card-header>
        
        <div class="md-layout md-size-100">
          <md-card-media>
            <img style="border-radius: 5px;" class="user-profile-avatar" :src="avatar" alt="Avatar">
          </md-card-media>

          <md-card-content style="text-align: right; position: relative;" class="md-layout md-layout-item md-alignment-center-right">
            <div style="position: absolute; top: 0; left: 0; margin-left: 15px; width: 65%; text-align: left;">
              <p style="margin-bottom: 10px;" class="md-title md-small-hide">{{ this.username }}</p>
              <p class="md-small-hide md-subheading" style="text-align: left;">{{ this.bio }}</p>
            </div>
            <div class="md-layout-item" style="white-space: nowrap;">
              <img :title="this.rank" :src="getRankLogo(this.rank)" alt="Rank">
              <span><h2><md-icon>emoji_events</md-icon>Elo - {{ this.elo }}</h2></span>
            </div>
          </md-card-content>
        </div>

        <div style="display: flex; justify-content: space-around;">
          <span><h2><md-icon class="history-win">add_box</md-icon>Wins - {{ this.win }}</h2></span>
          <span><h2><md-icon class="history-lose">indeterminate_check_box</md-icon>Loses - {{ this.lose }}</h2></span>
        </div>
        <div v-if="displayAchievements" style="margin: 15px 0;">
          <p class="md-title">Achievements</p>
          <img :class="getAchievementClass('playcount_1')" title="Play 5 Games" src="../assets/achievement_playcount_1.png" alt="Playcount Medal">
          <img :class="getAchievementClass('playcount_2')" title="Play 10 Games" src="../assets/achievement_playcount_2.png" alt="Playcount Medal">
          <img :class="getAchievementClass('spectate')" title="Spectate a Game" src="../assets/achievement_spectate.png" alt="Spectate Medal">
          <img :class="getAchievementClass('42')" title="Log in with 42" src="../assets/achievement_42.png" alt="Spectate Medal">
        </div>

        <md-card-actions>
          <div v-if="ingame && !isloggeduser">
            <md-button class="md-primary" @click="spectate()" :disabled="loading">Spectate <md-icon>visibility</md-icon></md-button>
          </div>
          <div v-if="isfriend">
            <md-button @click="rmFriend()" class="md-accent" :disabled="loading">Remove Friend <md-icon>person_remove</md-icon></md-button>
          </div>
          <div v-else-if="!isloggeduser">
            <md-button @click="addFriend()" class="md-primary" :disabled="loading">Add Friend <md-icon>person_add</md-icon></md-button>
          </div>
          <div v-if="!blocked && !isloggeduser">
            <md-button class="md-accent" @click="block()" :disabled="loading">Block <md-icon>person_off</md-icon></md-button>
          </div>
          <div v-else-if="!isloggeduser">
            <md-button class="md-accent" @click="unblock()" :disabled="loading">Unblock <md-icon>person</md-icon></md-button>
          </div>
          <div v-if="!ingame && online && !isloggeduser">
            <md-button class="md-primary" @click="sendChallenge(username)" :disabled="loading">Duel <md-icon>supervisor_account</md-icon></md-button>
          </div>
        </md-card-actions>
      </md-card>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import store, { globalFunctions } from "../store";
import router from '../router'
import { eventBus } from '../main'


@Component
export default class UserCard extends Vue {
  public bio = ''
  public avatar = ''
  public elo = 100
  public win = 0
  public lose = 0
  public level = 0
	public loading = true
	public rank = 'Silver 1'
  public achievements: Array<string> = []
  public isfriend = false
  public isloggeduser = true
  public blocked = false
  public ingame = false
  public online = false

  @Prop({ default: store.state.username }) private username!: string;
  @Prop({ default: true }) private displayAchievements!: boolean;

  async mounted () {
    this.queryProfile()
  }

  @Watch('username')
  async onUsernameChange () {
    this.queryProfile()
  }

  sendChallenge() {
    eventBus.$emit('sendChallengeEvent', this.username)
  }

	async queryProfile (): Promise<void> {
    this.username = (this.username ? this.username : store.state.username)
		this.loading = true
    this.isloggeduser = true

    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/username/' + this.username, {
        method: 'GET'
      }
    )
    if (!response.ok) {
      return
    }
    const data = await response.json()
    this.bio = data.bio
    this.avatar = data.avatar
    this.elo = data.elo
    this.win = data.win
    this.lose = data.lose
    this.level = data.level;
    if (data.status === 'ingame')
      this.ingame = true
    if (data.status === 'online')
      this.online = true
    this.achievements = data.achievements;
    this.rank = data.rank;

    if (store.state.userId !== '') {
      if (store.state.userId !== data.id) {
        this.isloggeduser = false
      }
      const resp = await fetch(
        'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/friends/check/' + store.state.userId + '/' + this.username, {
          method: 'GET'
        }
      )
      if (!resp.ok) {
        return
      }
      const dat = await resp.json()
      this.isfriend = dat
    }

    if (globalFunctions.getToken() === 'error')
      return
    const isBlocked = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/isBlocked?name=' + this.username, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      }
    )
    if (!isBlocked.ok) {
      return
    }
		this.loading = false
    const idBlockedData = await isBlocked.json()
    this.blocked = idBlockedData.blocked;
  }

	getRankLogo(name: string) {
    const rank = name.replace(/\s/g, '_').toLowerCase()
    return '/' + rank + '.png'
  }
  
  getAchievementClass(name: string) {
    return 'achievement-medal ' + (this.achievements.indexOf(name) === -1 ? 'locked-achievement' : '')
  }

  getXpProgress (level: number) : number {
    return (level - Math.floor(level)) * 100
  }

  async addFriend (): Promise<void> {
    if (!this.$route.query.user || store.state.userId === '') {
      return
    }
    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/friends/' + store.state.userId + '/' + this.username, {
        method: 'POST'
      }
    )
    if (response.ok) {
      this.isfriend = true
    }
  }

  async rmFriend (): Promise<void> {
    if (!this.$route.query.user || store.state.userId === '') {
      return
    }
    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/friends/' + store.state.userId + '/' + this.username, {
        method: 'DELETE'
      }
    )
    if (response.ok) {
      this.isfriend = false
    }
  }

  async block() {
    if (globalFunctions.getToken() === 'error') {
      return
    }
    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/block?name=' + this.username, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      }
    )
    if (!response.ok) {
      store.commit('setPopupMessage', 'This user is already blocked or doesn\'t exist.')
      return
    }
    store.commit('setPopupMessage', `${this.username} has been blocked.`)
    this.blocked = true
  }

  async unblock() {
    if (globalFunctions.getToken() === 'error') {
      return
    }
    const response = await fetch(
      'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/unblock?name=' + this.username, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + globalFunctions.getToken()
        }
      }
    )
    if (!response.ok) {
      store.commit('setPopupMessage', 'This user wasn\'t blocked or doesn\'t exist.')
      return
    }
    store.commit('setPopupMessage', `${this.username} has been blocked.`)
    this.blocked = false
  }

  async spectate () {
    if (globalFunctions.getToken() === 'error') {
      store.commit('setPopupMessage', 'You must be logged in to spectate a game')
      return
    }

    const userGameIdResponse = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/game/player?name=${this.username}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${globalFunctions.getToken()}`
      }
    })
    if (!userGameIdResponse.ok) {
      store.commit('setPopupMessage', 'The game doesn\'t exist anymore')
      return
    }
    const id = (await userGameIdResponse.json()).id

    const gameJwtResponse = await fetch(`http://${process.env.VUE_APP_DOMAIN}:${process.env.VUE_APP_NEST_PORT}/game/requestSpectate?id=${id}`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + globalFunctions.getToken()
      }
    })
    if (!gameJwtResponse.ok) {
      store.commit('setPopupMessage', 'The game doesn\'t exist anymore')
      return
    }
    const data = await gameJwtResponse.json()
    window.localStorage.setItem('gameJwt', data.gameJwt)
    window.localStorage.setItem('spectator', 'true')
    router.push('/game?id=' + id)
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

.user-profile-avatar {
  width: 175px;
  height: 175px;
  object-fit: cover;
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

.user-profile-avatar {
  width: 175px;
  height: 175px;
  object-fit: cover;
}
</style>
