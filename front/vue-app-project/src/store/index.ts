import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { StoreType } from './types'

Vue.use(Vuex)

const store : StoreOptions<StoreType> = {
  state: {
    isLogged: false,
    username: '',
    notifications: [],
    userId: ''
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
    }
  }
}

export default new Vuex.Store<StoreType>(store)
