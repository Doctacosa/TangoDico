<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })
</script>


<template>
	<div>
		<header>
			<img src="@/assets/logo.png" alt="Logo" class="logo" />
		</header>

		<div class="about">
			<h2>{{ t("about.title") }}</h2>

			<div v-html="t('about.description', { email: 'tango@interordi.com' })"></div>

			<div v-html="t('about.warnings')" class="warnings"></div>

			<div class="web_mode">
				<div class="app_stores">

					<div v-html="t('about.app')"></div>

					<a href="https://apps.apple.com/app/tango-dico/id6754865090"><img :src="'/images/badge-apple-app-store-' + locale + '.svg'" alt="Download on the Apple App Store" /></a>

					<a href="https://play.google.com/store/apps/details?id=com.interordi.tango.twa"><img alt="Get it on Google Play" :src="'/images/badge-google-play-' + locale + '.png'"/></a>

					<a href="https://apps.microsoft.com/detail/9NX8WJHNW01F"><img :src="'/images/badge-microsoft-' + locale + '.png'" alt="Get it from Microsoft" /></a>

					<div v-html="t('about.app_footer')"></div>

				</div>
			</div>
			<!--div class="app_mode">App mode</div-->
		</div>
	</div>
</template>


<style>
.about {
	text-align: left;

	hr {
		margin-top: 30px;
		margin-bottom: 30px;
	}
}

.logo {
	width: 100%;
	max-width: 400px;
}

.warnings {
	border-left: 3px solid #FF5555;
	margin-top: 20px;
	padding-left: 10px;
	padding-top: 2px;
	padding-bottom: 2px;

	h3 {
		color: #FF5555;
		font-size: 90%;
		margin-top: 12px;
	}
}
</style>
