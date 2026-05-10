import { createRouter, createWebHashHistory } from 'vue-router'
import GuideView from './views/GuideView.vue'
import ButtonDocView from './views/ButtonDocView.vue'
import InputDocView from './views/InputDocView.vue'
import ChatMessageDocView from './views/ChatMessageDocView.vue'
import DialogDocView from './views/DialogDocView.vue'
import ModalDocView from './views/ModalDocView.vue'
import PopupDocView from './views/PopupDocView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/guide' },
    { path: '/guide', name: 'guide', component: GuideView },
    { path: '/components/button', name: 'button', component: ButtonDocView },
    { path: '/components/input', name: 'input', component: InputDocView },
    { path: '/components/chat-message', name: 'chat-message', component: ChatMessageDocView },
    { path: '/components/dialog', name: 'dialog', component: DialogDocView },
    { path: '/components/modal', name: 'modal', component: ModalDocView },
    { path: '/components/popup', name: 'popup', component: PopupDocView },
  ],
})

export default router
