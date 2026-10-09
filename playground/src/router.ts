import { createRouter, createWebHashHistory } from 'vue-router'
import GuideView from './views/GuideView.vue'
const ButtonDocView = () => import('./views/ButtonDocView.vue')
const InputDocView = () => import('./views/InputDocView.vue')
const IconDocView = () => import('./views/IconDocView.vue')
const RadioDocView = () => import('./views/RadioDocView.vue')
const CheckboxDocView = () => import('./views/CheckboxDocView.vue')
const ChatMessageDocView = () => import('./views/ChatMessageDocView.vue')
const DialogDocView = () => import('./views/DialogDocView.vue')
const ModalDocView = () => import('./views/ModalDocView.vue')
const MessageDocView = () => import('./views/MessageDocView.vue')
const PopupDocView = () => import('./views/PopupDocView.vue')
const WatermarkDocView = () => import('./views/WatermarkDocView.vue')
const SelectDocView = () => import('./views/SelectDocView.vue')
import { componentReferences } from './docs/reference'

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
    { path: '/components/message', name: 'message', component: MessageDocView },
    { path: '/components/popup', name: 'popup', component: PopupDocView },
    { path: '/components/watermark', name: 'watermark', component: WatermarkDocView },
    { path: '/components/select', name: 'select', component: SelectDocView },
    ...Object.keys(componentReferences).map((slug) => ({ path: `/components/${slug}`, name: slug, component: () => import('./views/ComponentDocView.vue'), props: { slug } })),
    { path: '/:pathMatch(.*)*', redirect: '/guide' },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 96 }
    if (to.path !== from.path) return { top: 0 }
  },
})

export default router
