import { createRouter, createWebHashHistory } from 'vue-router'
import GuideView from './views/GuideView.vue'
import ButtonDocView from './views/ButtonDocView.vue'
import InputDocView from './views/InputDocView.vue'
import ChatMessageDocView from './views/ChatMessageDocView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/guide' },
    { path: '/guide', name: 'guide', component: GuideView },
    { path: '/components/button', name: 'button', component: ButtonDocView },
    { path: '/components/input', name: 'input', component: InputDocView },
    { path: '/components/chat-message', name: 'chat-message', component: ChatMessageDocView },
  ],
})

export default router
