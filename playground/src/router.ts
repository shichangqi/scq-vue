import { createRouter, createWebHashHistory } from 'vue-router'
import GuideView from './views/GuideView.vue'
import ButtonDocView from './views/ButtonDocView.vue'
import InputDocView from './views/InputDocView.vue'
import IconDocView from './views/IconDocView.vue'
import RadioDocView from './views/RadioDocView.vue'
import CheckboxDocView from './views/CheckboxDocView.vue'
import ChatMessageDocView from './views/ChatMessageDocView.vue'
import DialogDocView from './views/DialogDocView.vue'
import ModalDocView from './views/ModalDocView.vue'
import MessageDocView from './views/MessageDocView.vue'
import PopupDocView from './views/PopupDocView.vue'
import WatermarkDocView from './views/WatermarkDocView.vue'
import SelectDocView from './views/SelectDocView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/guide' },
    { path: '/guide', name: 'guide', component: GuideView },
    { path: '/components/button', name: 'button', component: ButtonDocView },
    { path: '/components/input', name: 'input', component: InputDocView },
    { path: '/components/icon', name: 'icon', component: IconDocView },
    { path: '/components/radio', name: 'radio', component: RadioDocView },
    { path: '/components/checkbox', name: 'checkbox', component: CheckboxDocView },
    { path: '/components/chat-message', name: 'chat-message', component: ChatMessageDocView },
    { path: '/components/dialog', name: 'dialog', component: DialogDocView },
    { path: '/components/modal', name: 'modal', component: ModalDocView },
    { path: '/components/message', name: 'message', component: MessageDocView },
    { path: '/components/popup', name: 'popup', component: PopupDocView },
    { path: '/components/watermark', name: 'watermark', component: WatermarkDocView },
    { path: '/components/select', name: 'select', component: SelectDocView },
  ],
})

export default router
