import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { StoreType } from './types'

Vue.use(Vuex)

const store : StoreOptions<StoreType> = {
  state: {
    isLogged: false,
    requestedLogin: false,
    username: '',
    notifications: [],
    userId: '',
    errors: [],
    avatarUpdate: 0,
    popupMessage: '',
    role: 'user',
  },
  mutations: {
    setLogged (state : StoreType, value : boolean) : void {
      state.isLogged = value
    },

    setRole (state : StoreType, value : string) : void {
      state.role = value
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
      state.role = 'user'
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
    },

    setRequestedLogin (state : StoreType, data : any) : void {
      state.requestedLogin = data
    },

    setPopupMessage (state : StoreType, data : any) : void {
      state.popupMessage = data
    },
  },
  getters: {
    username (state : StoreType) : string {
      return state.username
    },

    role (state : StoreType) : string {
      return state.role
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
      return 'http://' + process.env.VUE_APP_DOMAIN + ':' + process.env.VUE_APP_NEST_PORT + '/user/avatar/' + state.userId + '?' + state.avatarUpdate
    },

    avatarUpdate (state : StoreType) : number {
      return state.avatarUpdate
    },

    requestedLogin (state : StoreType) : boolean {
      return state.requestedLogin
    },

    popupMessage (state : StoreType) : string {
      return state.popupMessage
    },
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
