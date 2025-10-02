import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import PrimeVue from 'primevue/config';
import router from './router'
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
