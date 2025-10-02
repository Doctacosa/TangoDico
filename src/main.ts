import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import PrimeVue from 'primevue/config';
import router from './router'
import VueMatomo from 'vue-matomo'
import App from './App.vue'

//import { definePreset, palette } from '@primevue/themes';
import Aura from '@primeuix/themes/aura';

import messages from './data/messages.ts'

import InputText from 'primevue/inputtext';
import Select from 'primevue/select';


// custom color
/*
const primaryColor = palette('#5EDA00');

const clTheme = definePreset(Aura, {
	semantic: {
		primary: primaryColor
	}
});
*/


// Create VueI18n instance with options
const i18n = createI18n({
	legacy: false, // you must set `false`, to use Composition API
	globalInjection: true,
	locale: 'fr',	//Main locale
	fallbackLocale: 'en',	//Fallback
	messages,	//Set locale messages
})


const app = createApp(App)

app.use(i18n)
app.use(router)

app.use(VueMatomo, {
	// Configure your matomo server and site by providing
	host: 'https://apps.interordi.com/matomo',
	siteId: 13,

	// Enables automatically registering pageviews on the router
	router: router,

	// Enables link tracking on regular links. Note that this won't
	// work for routing links (ie. internal Vue router links)
	// Default: true
	enableLinkTracking: true,

	// Run Matomo without cookies
	// Default: false
	disableCookies: false,

	// Require consent before sending tracking information to matomo
	// Default: false
	requireConsent: false,

	// Require consent before creating matomo session cookie
	// Default: false
	requireCookieConsent: false,

	// Enable the heartbeat timer (https://developer.matomo.org/guides/tracking-javascript-guide#accurately-measure-the-time-spent-on-each-page)
	// Default: false
	enableHeartBeatTimer: false,

	// Set the heartbeat timer interval
	// Default: 15
	heartBeatTimerInterval: 15,
});

app.use(PrimeVue, {
	theme: {
		preset: Aura,
		//preset: clTheme,
		options: {
			darkModeSelector: '.dark-mode',
		}
	}
});

app.component('InputText', InputText);
app.component('Select', Select);

app.provide('t', i18n.global.t);

app.mount('#app')
