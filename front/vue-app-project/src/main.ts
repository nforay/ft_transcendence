import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { MdButton, MdList, MdToolbar, MdIcon, MdMenu, MdBadge, MdAvatar, MdTooltip, MdField } from 'vue-material/dist/components'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

Vue.use(MdButton)
Vue.use(MdToolbar)
Vue.use(MdIcon)
Vue.use(MdMenu)
Vue.use(MdBadge)
Vue.use(MdTooltip)
Vue.use(MdList)
Vue.use(MdAvatar)
Vue.use(MdField)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
  async beforeCreate () {
    if (document.cookie.indexOf('Token') <= -1) {
      store.commit('logout')
      return
    }
    const token = document.cookie.split('Token=')[1].split(';')[0]
    const response = await fetch('http://localhost:4000/user/islogged', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
    if (!response.ok) {
      store.commit('logout')
    } else {
      const data = await response.json()
      store.commit('setLogged', data.isLogged)
      store.commit('setUsername', data.name)
      store.commit('setUserId', data.id)
    }
  }
}).$mount('#app')
