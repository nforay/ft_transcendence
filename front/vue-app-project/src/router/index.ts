import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import store from '@/store'
import ChatBox from '../components/Chat.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/Leaderboard.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/authenticate',
    name: 'Authenticate',
    component: () => import('../views/Authenticate.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/UserStats.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/redirect',
    name: 'Redirect',
    component: () => import('../views/Redirect.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/play',
    name: 'Play',
    component: () => import('../views/Play.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/game',
    name: 'Game',
    component: () => import('../views/Game.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/enable2fa',
    name: 'Enable2FA',
    component: () => import('../views/Enable2FA.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/validate2fa',
    name: 'Validate2FA',
    component: () => import('../views/Validate2FA.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/disable2fa',
    name: 'Disable2FA',
    component: () => import('../views/Disable2FA.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!store.state.isLogged) {
      next(/* { name: 'Home' } */)
      return
    }
  }
  next()
})

export default router
