import { createApp } from 'vue'
import App from './App.vue'
import ScqVue from 'scq-vue'
import router from './router'
// @ts-ignore playground style side-effect import
import '../../styles/index.css'
import 'highlight.js/styles/github-dark.css'
// @ts-ignore playground style side-effect import
import './playground.css'

createApp(App).use(ScqVue).use(router).mount('#app')
