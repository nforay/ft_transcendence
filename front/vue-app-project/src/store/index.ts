import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { StoreType } from './types'

Vue.use(Vuex)

const store : StoreOptions<StoreType> = {
  state: {
    isLogged: false,
    username: ''
  },
  mutations: {
    setLogged (state : StoreType, value : boolean) : void {
      state.isLogged = value
    }
  }
}

export default new Vuex.Store<StoreType>(store)
