import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { StoreType } from './types'

Vue.use(Vuex)

export const store : StoreOptions<StoreType> = {
  state: {
    isLogged: false,
    username: '',
    notifications: [],
    userId: '',
    errors: [],
    avatarUpdate: 0
  },
  mutations: {
    setLogged (state : StoreType, value : boolean) : void {
      state.isLogged = value
    },

    setUsername (state : StoreType, value : string) : void {
      state.username = value
    },

    setUserId (state : StoreType, value : string) : void {
      state.userId = value
    },

    logout (state : StoreType) : void {
      state.isLogged = false
      state.username = ''
      state.notifications = []
      state.userId = ''
    },

    setToken (state : StoreType, data : any) : void {
      const expires = new Date(new Date().getTime() + data.expiresIn).toUTCString()
      document.cookie = 'Token=' + data.token + ';expires=' + expires
    },

    expireToken () : void {
      document.cookie = 'Token=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
    },

    updateAvatar (state : StoreType) : void {
      state.avatarUpdate = new Date().getTime()
    }
  },
  getters: {
    username (state : StoreType) : string {
      return state.username
    },

    notifications (state : StoreType) : string[] {
      return state.notifications
    },

    isLogged (state : StoreType) : boolean {
      return state.isLogged
    },

    userId (state : StoreType) : string {
      return state.userId
    },

    errors (state : StoreType) : string[] {
      return state.errors
    },

    avatar (state : StoreType) : string {
      return 'http://localhost:4000/user/avatar/' + state.userId + '?' + state.avatarUpdate
    },

    avatarUpdate (state : StoreType) : number {
      return state.avatarUpdate
    }
  }
}

export const globalFunctions = {
  getToken () : string {
    if (document.cookie.indexOf('Token=') === -1) {
      return 'error'
    }

    const splitted = document.cookie.split('Token=')
    if (!splitted || splitted.length <= 1) {
      return 'error'
    }

    const token = splitted[1]
    return token
  }
}

export default new Vuex.Store<StoreType>(store)
