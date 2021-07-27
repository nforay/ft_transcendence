import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import MdButton from 'vue-material/dist/components/MdButton'
import MdToolbar from 'vue-material/dist/components/MdToolbar'
import MdIcon from 'vue-material/dist/components/MdIcon'
import MdMenu from 'vue-material/dist/components/MdMenu'
import MdBadge from 'vue-material/dist/components/MdBadge'
import MdTooltip from 'vue-material/dist/components/MdTooltip'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

Vue.use(MdButton)
Vue.use(MdToolbar)
Vue.use(MdIcon)
Vue.use(MdMenu)
Vue.use(MdBadge)
Vue.use(MdTooltip)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
