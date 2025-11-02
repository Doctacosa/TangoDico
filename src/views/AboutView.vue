<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>


<template>
	<div>
		<header>
			<img src="@/assets/logo.png" alt="Logo" class="logo" />
		</header>

		<div class="about">
			<h2>{{ t("about.title") }}</h2>

			<div v-html="t('about.description', { email: 'tango@interordi.com' })"></div>
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
</style>
