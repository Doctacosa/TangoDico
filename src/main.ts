import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'

import messages from './data/messages.ts'

// Create VueI18n instance with options
const i18n = createI18n({
	legacy: false, // you must set `false`, to use Composition API
	globalInjection: true,
	locale: 'fr',	//Main locale
	fallbackLocale: 'en',	//Fallback
	messages,	//Set locale messages
})


const app = createApp(App)

app.use(router)
app.use(i18n)

app.provide('t', i18n.global.t);

app.mount('#app')
